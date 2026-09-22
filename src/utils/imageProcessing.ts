/**
 * Image processing utilities for admin uploads.
 *
 * We do NOT lossy-compress the images: employees must be able to download the
 * greeting cards at the best possible quality (see commit e2154d3).
 *
 * What we do:
 *  - Convert the original file to a base64 data URL without resizing or format
 *    conversion, preserving dimensions and PNG transparency.
 *  - Enforce a HARD cap (MAX_IMAGE_BYTES, 8 MB) and return a soft `warning`
 *    above WARN_IMAGE_BYTES (3 MB) so the uploader can tell the admin.
 *  - Offer `uploadImageToStorage()` which sends the file to Supabase Storage
 *    through /api/admin/upload and returns a public URL — the preferred path,
 *    since base64 inside JSONB rows makes every gallery load multi-MB.
 */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // hard cap — matches /api/admin/upload + bucket limit
export const WARN_IMAGE_BYTES = 3 * 1024 * 1024; // soft warning threshold
/** Above this we use a signed direct-to-Storage upload (Vercel caps function bodies at ~4.5 MB). */
const DIRECT_UPLOAD_MAX_BYTES = 3 * 1024 * 1024;

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export interface CompressedImage {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
  /** Non-fatal advice, e.g. "large file — page loads will be slow". */
  warning?: string;
}

export interface UploadedImage {
  /** Public, cacheable URL on Supabase Storage. Store THIS in the template source. */
  url: string;
  path: string;
  bytes: number;
  width: number;
  height: number;
  contentType: string;
}

/** Throws with an Arabic message when the file is not an acceptable image. Returns an optional warning. */
export function validateImageFile(file: File): string | undefined {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('نوع الملف غير مدعوم. استخدم PNG أو JPG أو WebP.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`حجم الصورة ${formatBytes(file.size)} يتجاوز الحد الأقصى (${formatBytes(MAX_IMAGE_BYTES)}).`);
  }
  if (file.size > WARN_IMAGE_BYTES) {
    return `الصورة كبيرة (${formatBytes(file.size)}). ستعمل لكن تحميل المعرض سيكون أبطأ — يُفضّل أقل من ${formatBytes(WARN_IMAGE_BYTES)}.`;
  }
  return undefined;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Kept for backwards compatibility with AdminUploader: returns the ORIGINAL
 * bytes as a data URL (no compression), plus dimensions and a size warning.
 */
export async function compressImageFile(file: File): Promise<CompressedImage> {
  const warning = validateImageFile(file);
  const original = await fileToImage(file);
  const dataUrl = await fileToDataUrl(file);
  return { dataUrl, width: original.width, height: original.height, bytes: file.size, warning };
}

/**
 * Upload the ORIGINAL file to Supabase Storage via the admin API and return its
 * public URL. Requires an active admin session cookie.
 *
 *  - ≤ 3 MB: single POST multipart to /api/admin/upload.
 *  - > 3 MB: ask the API for a signed upload URL, then PUT straight to Storage
 *            (bypasses the Vercel request-body limit).
 */
export async function uploadImageToStorage(
  file: File,
  format?: 'square' | 'story' | 'post',
): Promise<UploadedImage> {
  validateImageFile(file);
  const dims = await fileToImage(file);

  if (file.size <= DIRECT_UPLOAD_MAX_BYTES) {
    const fd = new FormData();
    fd.append('file', file, file.name || 'image');
    if (format) fd.append('format', format);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) throw new Error(json.error || 'فشل رفع الصورة.');
    return { url: json.url, path: json.path, bytes: json.bytes, width: dims.width, height: dims.height, contentType: json.contentType };
  }

  // Large file → signed direct upload.
  const signRes = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'sign', contentType: file.type, format }),
  });
  const sign = await signRes.json().catch(() => ({}));
  if (!signRes.ok || !sign.ok) throw new Error(sign.error || 'فشل تجهيز رابط الرفع.');

  const put = await fetch(sign.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type, 'x-upsert': 'false' },
    body: file,
  });
  if (!put.ok) throw new Error('فشل رفع الصورة إلى التخزين.');

  return { url: sign.url, path: sign.path, bytes: file.size, width: dims.width, height: dims.height, contentType: file.type };
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('تعذر قراءة الصورة. تأكد من سلامة الملف.'));
    };
    img.src = url;
  });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
