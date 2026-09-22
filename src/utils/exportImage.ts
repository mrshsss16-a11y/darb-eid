import { toPng, toJpeg, getFontEmbedCSS } from 'html-to-image';
import { fitAllText } from '@/utils/autoFit';

export type ExportFormat = 'png' | 'jpg';

/** Font family used for the employee name — must match TemplateCanvas. */
export const NAME_FONT_FAMILY = 'DIN Next Arabic';

/**
 * Pixel ratio policy (the node is already laid out at the format's NATIVE
 * size, so these multiply 1080/1200-wide canvases):
 *  - square 1080×1080 → 2   (2160×2160 ≈ 4.7 MP)
 *  - post   1200×630  → 2   (2400×1260 ≈ 3.0 MP)
 *  - story  1080×1920 → 1.5 (1620×2880 ≈ 4.7 MP)
 * Anything above ~5 MP risks Safari's canvas limit / OOM on mid-range phones.
 */
export function pickPixelRatio(width: number, height: number): number {
  return width * height > 1_500_000 ? 1.5 : 2;
}

const isWebKit = () =>
  typeof navigator !== 'undefined' &&
  /AppleWebKit/i.test(navigator.userAgent) &&
  !/Chrome|CriOS|Chromium|Edg|Android/i.test(navigator.userAgent);

/** Wait for every weight of the name font we might use, plus all pending fonts. */
export async function ensureFontsLoaded(sampleText = 'اسم الموظف') {
  if (typeof document === 'undefined' || !(document as any).fonts) return;
  const fonts = (document as any).fonts as FontFaceSet;
  const loads: Promise<unknown>[] = [];
  for (const w of [400, 700, 900]) {
    try {
      loads.push(fonts.load(`${w} 48px "${NAME_FONT_FAMILY}"`, sampleText));
    } catch {
      /* ignore */
    }
  }
  try {
    await Promise.all(loads);
  } catch {
    /* ignore */
  }
  try {
    await fonts.ready;
  } catch {
    /* ignore */
  }
}

function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    const t = setTimeout(resolve, 60);
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        clearTimeout(t);
        resolve();
      });
    }
  });
}

let fontCssCache: Promise<string> | null = null;
/** Embed CSS is expensive (fetches every @font-face); compute it once per session. */
function getEmbeddedFontCss(node: HTMLElement) {
  if (!fontCssCache) {
    fontCssCache = getFontEmbedCSS(node).catch(() => {
      fontCssCache = null;
      return '';
    });
  }
  return fontCssCache;
}

/** Exclude preview-only / placeholder nodes (`data-export-skip="true"`). */
function exportFilter(node: HTMLElement) {
  return node?.dataset?.exportSkip !== 'true';
}

/**
 * Render a DOM node to a data URL WITHOUT downloading it.
 *
 * Quality notes:
 *  - `node` must already be laid out at the format's native pixel size
 *    (TemplateCanvas without `pixelWidth`).
 *  - Fonts: we await FontFaceSet.load for the exact family/weights and pass
 *    `fontEmbedCSS` (the /public/fonts TTFs are same-origin, so html-to-image
 *    can inline them) — this prevents the "exported with Times New Roman"
 *    bug on Safari/iOS.
 *  - Auto-fit is re-applied synchronously right before capture so it never
 *    races React's effect after a format/name change.
 *  - WebKit (Safari/iOS): the first rasterisation often drops fonts/images;
 *    we do a throw-away warm-up pass and keep the second result.
 */
export async function renderNodeToDataUrl(
  node: HTMLElement,
  opts: {
    format: ExportFormat;
    pixelRatio?: number;
    width?: number;
    height?: number;
  },
): Promise<string> {
  await ensureFontsLoaded();
  fitAllText(node);
  // Give the browser one frame to apply the transform/fonts before cloning.
  // rAF never fires in a background tab, so guard it with a timeout or the
  // export would hang forever if the user switches tabs mid-export.
  await nextFrame();

  const w = opts.width ?? node.offsetWidth;
  const h = opts.height ?? node.offsetHeight;
  const pixelRatio = opts.pixelRatio ?? pickPixelRatio(w, h);
  const fontEmbedCSS = await getEmbeddedFontCss(node);

  const common = {
    pixelRatio,
    cacheBust: true,
    skipFonts: false,
    fontEmbedCSS: fontEmbedCSS || undefined,
    // NOTE: do not also pass canvasWidth/Height — html-to-image multiplies
    // them by pixelRatio again (would yield 4320² for a square).
    width: w,
    height: h,
    filter: exportFilter,
    style: {
      // Lock the node to its rendered size; html-to-image otherwise picks up
      // surrounding transforms which causes blurry exports.
      transform: 'none',
      transformOrigin: 'top left',
      borderRadius: '0',
      boxShadow: 'none',
    },
  };

  const run = () =>
    opts.format === 'png'
      ? toPng(node, common)
      : toJpeg(node, { ...common, quality: 0.95, backgroundColor: '#FFFFFF' });

  if (isWebKit()) {
    // Warm-up pass: Safari resolves @font-face/<img> lazily inside the
    // foreignObject clone; the second pass is reliably complete.
    try {
      await run();
    } catch {
      /* ignore */
    }
  }
  return run();
}

/** Export a DOM node to a high-quality image and trigger a download. */
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
  const dataUrl = await renderNodeToDataUrl(node, opts);
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
