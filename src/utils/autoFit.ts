/**
 * Auto-fit text utility.
 *
 * Given a target element, measures its rendered width vs. the max allowed and
 * applies a CSS scale that shrinks long names without cropping. We use scale
 * rather than reducing font-size so the typography remains crisp during
 * html-to-image export (no re-layout, no jitter).
 */
export function fitTextToWidth(el: HTMLElement, maxWidthPx: number) {
  el.style.transform = 'scale(1)';
  const width = el.scrollWidth;
  if (width <= maxWidthPx) {
    el.style.transform = 'scale(1)';
    return;
  }
  const scale = Math.max(0.55, maxWidthPx / width);
  el.style.transform = `scale(${scale})`;
}
