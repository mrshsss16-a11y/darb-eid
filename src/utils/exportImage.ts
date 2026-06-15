import { toPng, toJpeg } from 'html-to-image';

export type ExportFormat = 'png' | 'jpg';

/**
 * Export a DOM node to a high-quality image.
 *
 * Quality notes:
 *  - We bake in a `pixelRatio` of 2-3 so social platforms get a sharp result
 *    even after their own re-compression.
 *  - For JPG we use quality 0.95 (visually lossless for greeting cards).
 *  - We pre-load all webfonts via document.fonts.ready to avoid the dreaded
 *    "exported with Times New Roman" bug on Safari/iOS.
 */
export async function exportNodeAsImage(
  node: HTMLElement,
  opts: {
    format: ExportFormat;
    filename: string;
    pixelRatio?: number;
    width?: number;
    height?: number;
  },
): Promise<string> {
  // Make sure web fonts are downloaded before snapshotting.
  if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
    try {
      await (document as any).fonts.ready;
    } catch {}
  }

  const common = {
    pixelRatio: opts.pixelRatio ?? 2.5,
    cacheBust: true,
    skipFonts: false,
    width: opts.width,
    height: opts.height,
    style: {
      // Lock the node to its rendered size; html-to-image otherwise picks up
      // surrounding transforms which causes blurry exports.
      transform: 'none',
      transformOrigin: 'top left',
    },
  };

  const dataUrl =
    opts.format === 'png'
      ? await toPng(node, common)
      : await toJpeg(node, { ...common, quality: 0.95, backgroundColor: '#FFFFFF' });

  triggerDownload(dataUrl, opts.filename);
  return dataUrl;
}

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Build a WhatsApp share URL — opens chooser to forward image + text. */
export function whatsappShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
