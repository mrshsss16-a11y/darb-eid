/**
 * Image processing utilities for admin uploads.
 *
 * Why we compress:
 *  - localStorage has a per-origin quota (~5–10 MB total). A raw 4 MB JPG
 *    becomes ~5.3 MB as a base64 data URL, so even a single upload can blow
 *    the budget. After 2-3 uploads it silently fails with QuotaExceededError.
 *  - For social-media cards 1080×1080 is plenty — we don't need 4k photos.
 *
 * What we do:
 *  - Resize the source image so the longest edge is at most MAX_DIMENSION.
 *  - Re-encode as JPEG at quality 0.86 (visually indistinguishable from
 *    source for greeting-card content).
 *  - Return both the data URL and its decoded byte length so the UI can
 *    surface "compressed from X MB to Y KB".
 */

const MAX_DIMENSION = 1600; // px — generous; canvases export at 1080-1920
const JPEG_QUALITY = 0.86;

export interface CompressedImage {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
}

export async function compressImageFile(file: File): Promise<CompressedImage> {
  const original = await fileToImage(file);
  const { width: srcW, height: srcH } = original;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(srcW, srcH));
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  // Improve downscale quality.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(original, 0, 0, w, h);

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const bytes = estimateBase64Bytes(dataUrl);
  return { dataUrl, width: w, height: h, bytes };
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

/** Estimate the byte size of the payload encoded in a base64 data URL. */
function estimateBase64Bytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return dataUrl.length;
  const b64 = dataUrl.slice(commaIdx + 1);
  // Each 4 base64 chars = 3 bytes; subtract padding.
  const padding = (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
  return Math.floor((b64.length * 3) / 4) - padding;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
