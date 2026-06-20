/**
 * Image processing utilities for admin uploads.
 *
 * We do NOT compress the images to ensure employees can download the greeting cards at the best possible quality.
 *
 * What we do:
 *  - Convert the original file directly to a base64 data URL without resizing or format conversions.
 *  - Keep the original dimensions (width and height) and preserve PNG transparency.
 *  - Return both the data URL and its size in bytes for visual confirmation.
 */

export interface CompressedImage {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
    reader.readAsDataURL(file);
  });
}

export async function compressImageFile(file: File): Promise<CompressedImage> {
  const original = await fileToImage(file);
  const { width: srcW, height: srcH } = original;

  const dataUrl = await fileToDataUrl(file);
  const bytes = file.size;
  return { dataUrl, width: srcW, height: srcH, bytes };
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

