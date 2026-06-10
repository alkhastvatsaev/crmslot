/**
 * Scroll horizontal d’un strip N-slots vers le slot `centerIndex` (défaut : 1).
 * Compatible gap flex entre panneaux.
 */
export function scrollSnapStripToCenter(el: HTMLElement, centerIndex = 1): void {
  const child = el.children[centerIndex] as HTMLElement | undefined;
  if (!child) {
    el.scrollLeft = el.scrollWidth / 3;
    return;
  }
  const stripRect = el.getBoundingClientRect();
  const childRect = child.getBoundingClientRect();
  const delta = childRect.left - stripRect.left - (stripRect.width - childRect.width) / 2;
  el.scrollLeft += delta;
}
