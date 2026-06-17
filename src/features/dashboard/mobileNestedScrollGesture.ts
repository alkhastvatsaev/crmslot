/** Seuil (px) avant de verrouiller l'axe du geste. */
export const MOBILE_SCROLL_AXIS_LOCK_THRESHOLD_PX = 10;

/** Ratio minimal entre composantes pour choisir l'axe dominant. */
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

function isVerticallyScrollable(node: HTMLElement): boolean {
  const style = window.getComputedStyle(node);
  const overflowY = style.overflowY;
  const overflow = style.overflow;
  const allowsYScroll =
    overflowY === "auto" || overflowY === "scroll" || overflow === "auto" || overflow === "scroll";
  return allowsYScroll && node.scrollHeight > node.clientHeight + 1;
}

function findVerticalScrollParent(
  target: EventTarget | null,
  boundary: HTMLElement
): HTMLElement | null {
  let node = target instanceof HTMLElement ? target : null;
  while (node && node !== boundary) {
    if (isVerticallyScrollable(node)) return node;
    node = node.parentElement;
  }
  return null;
}

export function isVerticalScrollAtTop(el: HTMLElement, epsilonPx = 8): boolean {
  return el.scrollTop <= epsilonPx;
}

export function isVerticalScrollAtBottom(el: HTMLElement, epsilonPx = 8): boolean {
  const maxScroll = el.scrollHeight - el.clientHeight;
  return maxScroll <= epsilonPx || el.scrollTop >= maxScroll - epsilonPx;
}

/** Le panneau peut encore absorber ce geste vertical. */
export function canConsumeVerticalScroll(el: HTMLElement, deltaY: number): boolean {
  const maxScroll = el.scrollHeight - el.clientHeight;
  if (maxScroll <= 0) return false;
  if (deltaY > 0) return el.scrollTop > 0;
  return el.scrollTop < maxScroll - 1;
}

/**
 * Route les gestes touch sur un strip horizontal :
 * - dominant vertical → scroll interne d'un rail latéral si possible
 * - dominant horizontal → scroll du strip (rails gauche/droite)
 */
export function bindMobileNestedScrollGesture(strip: HTMLElement): () => void {
  let startX = 0;
  let startY = 0;
  let startStripScrollLeft = 0;
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
      if (innerScrollEl && canConsumeVerticalScroll(innerScrollEl, dy)) {
        event.preventDefault();
        innerScrollEl.scrollTop = startInnerScrollTop - dy;
      }
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
