/** Seuil (px) avant de verrouiller l’axe du geste. */
export const MOBILE_SCROLL_AXIS_LOCK_THRESHOLD_PX = 10;

/** Ratio minimal entre composantes pour choisir l’axe dominant. */
export const MOBILE_SCROLL_AXIS_RATIO = 1.25;

export type MobileScrollAxis = "none" | "x" | "y";

export function resolveMobileScrollAxis(
  dx: number,
  dy: number,
  threshold = MOBILE_SCROLL_AXIS_LOCK_THRESHOLD_PX,
  ratio = MOBILE_SCROLL_AXIS_RATIO
): MobileScrollAxis {
  if (Math.hypot(dx, dy) < threshold) return "none";
  if (Math.abs(dy) >= Math.abs(dx) * ratio) return "y";
  if (Math.abs(dx) >= Math.abs(dy) * ratio) return "x";
  return "none";
}

/** Vrai si le strip horizontal est aligné sur le panneau centre. */
export function isMobileStripCentered(
  strip: HTMLElement,
  centerIndex = 1,
  tolerancePx = 24
): boolean {
  const child = strip.children[centerIndex] as HTMLElement | undefined;
  if (!child) return true;
  const stripRect = strip.getBoundingClientRect();
  const childRect = child.getBoundingClientRect();
  const offset = childRect.left - stripRect.left - (stripRect.width - childRect.width) / 2;
  return Math.abs(offset) <= tolerancePx;
}

function findVerticalScrollParent(
  target: EventTarget | null,
  boundary: HTMLElement
): HTMLElement | null {
  let node = target instanceof HTMLElement ? target : null;
  while (node && node !== boundary) {
    const style = window.getComputedStyle(node);
    const scrollableY =
      (style.overflowY === "auto" || style.overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight + 1;
    if (scrollableY) return node;
    node = node.parentElement;
  }
  return null;
}

function canConsumeVerticalScroll(el: HTMLElement, deltaY: number): boolean {
  const maxScroll = el.scrollHeight - el.clientHeight;
  if (maxScroll <= 0) return false;
  if (deltaY > 0) return el.scrollTop > 0;
  return el.scrollTop < maxScroll - 1;
}

function findMobilePager(strip: HTMLElement): HTMLElement | null {
  return strip.closest("[data-mobile-pager]");
}

/**
 * Route les gestes touch sur un strip horizontal :
 * - dominant vertical → scroll du pager parent (changement de page)
 * - dominant horizontal → scroll du strip (rails gauche/droite)
 * Priorise le scroll interne d’un panneau latéral si possible.
 */
export function bindMobileNestedScrollGesture(strip: HTMLElement): () => void {
  const pager = findMobilePager(strip);
  if (!pager) return () => {};

  let startX = 0;
  let startY = 0;
  let startStripScrollLeft = 0;
  let startPagerScrollTop = 0;
  let startInnerScrollTop = 0;
  let axis: MobileScrollAxis = "none";
  let innerScrollEl: HTMLElement | null = null;

  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    axis = "none";
    innerScrollEl = findVerticalScrollParent(event.target, strip);
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    startStripScrollLeft = strip.scrollLeft;
    startPagerScrollTop = pager.scrollTop;
    startInnerScrollTop = innerScrollEl?.scrollTop ?? 0;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    const dx = x - startX;
    const dy = y - startY;

    if (axis === "none") {
      axis = resolveMobileScrollAxis(dx, dy);
      if (axis === "none") return;
    }

    if (axis === "y") {
      event.preventDefault();
      if (innerScrollEl && canConsumeVerticalScroll(innerScrollEl, dy)) {
        innerScrollEl.scrollTop = startInnerScrollTop - dy;
        return;
      }
      pager.scrollTop = startPagerScrollTop - dy;
      return;
    }

    if (axis === "x") {
      event.preventDefault();
      strip.scrollLeft = startStripScrollLeft - dx;
    }
  };

  strip.addEventListener("touchstart", onTouchStart, { passive: true });
  strip.addEventListener("touchmove", onTouchMove, { passive: false });

  return () => {
    strip.removeEventListener("touchstart", onTouchStart);
    strip.removeEventListener("touchmove", onTouchMove);
  };
}
