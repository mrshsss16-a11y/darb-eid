/**
 * Auto-fit text utility.
 *
 * Given a target element, measures its rendered (layout) width vs. the max
 * allowed and applies a CSS scale that shrinks long names without cropping.
 * We use scale rather than reducing font-size so the typography remains crisp
 * during html-to-image export (no re-layout, no jitter).
 *
 * Contract with TemplateCanvas:
 *  - the element is `display:inline-block; white-space:nowrap` (.fit-text)
 *  - it carries `data-fit-max` (max width in CSS px) and `data-fit-align`
 *    (left | center | right) so `fitAllText()` can re-run the fit
 *    synchronously on the hidden export node right before capture.
 */

export type FitAlign = 'left' | 'center' | 'right';

/** Minimum scale — below this Arabic glyphs become illegible on WhatsApp. */
export const MIN_FIT_SCALE = 0.5;

function originFor(align: FitAlign): string {
  // Keep the visual anchor identical to the layout anchor used by the wrapper
  // (`translate(-50%|-100%|0, -50%)`), so a shrunk name stays exactly where the
  // full-size name would sit.
  return align === 'center' ? '50% 50%' : align === 'right' ? '100% 50%' : '0% 50%';
}

export function fitTextToWidth(
  el: HTMLElement,
  maxWidthPx: number,
  align: FitAlign = 'center',
): number {
  el.style.transformOrigin = originFor(align);
  el.style.transform = 'none';
  // scrollWidth ignores transforms; fall back to the layout rect for browsers
  // that report 0 for inline-blocks with sub-pixel widths.
  const width = el.scrollWidth || el.getBoundingClientRect().width;
  if (!width || !maxWidthPx || width <= maxWidthPx) {
    el.style.transform = 'none';
    return 1;
  }
  const scale = Math.max(MIN_FIT_SCALE, maxWidthPx / width);
  el.style.transform = `scale(${scale.toFixed(4)})`;
  return scale;
}

/**
 * Re-run the fit for every fit element under `root` using the data attributes
 * written by TemplateCanvas. Synchronous — call this right before
 * html-to-image captures the node so the export never races the React effect.
 */
export function fitAllText(root: HTMLElement) {
  const nodes = root.querySelectorAll<HTMLElement>('[data-fit-max]');
  nodes.forEach((el) => {
    const max = parseFloat(el.dataset.fitMax || '0');
    const align = (el.dataset.fitAlign as FitAlign) || 'center';
    if (max > 0) fitTextToWidth(el, max, align);
  });
}
