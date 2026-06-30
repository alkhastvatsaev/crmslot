/** Durée slide + fondu entre hubs — calée sur `--mobile-page-transition-duration`. */
export const MOBILE_PAGE_TRANSITION_MS = 420;

export type MobilePageTransitionDirection = "next" | "prev";

export type MobileScreenHostPanelPhase =
  | "active"
  | "enter-next"
  | "enter-prev"
  | "exit-next"
  | "exit-prev"
  | "suspended";

export function computeMobilePageTransitionDirection(
  fromIndex: number,
  toIndex: number
): MobilePageTransitionDirection | null {
  if (fromIndex === toIndex) return null;
  return toIndex > fromIndex ? "next" : "prev";
}

export function computeMobileMountedPageIndices(
  activePageIndex: number,
  outgoingPageIndex: number | null = null
): Set<number> {
  const indices = new Set([activePageIndex]);
  if (outgoingPageIndex !== null && outgoingPageIndex !== activePageIndex) {
    indices.add(outgoingPageIndex);
  }
  return indices;
}

export function computeMobileScreenHostPanelPhase(
  panelIndex: number,
  activeIndex: number,
  outgoingIndex: number | null,
  direction: MobilePageTransitionDirection | null,
  overlayOpen: boolean
): MobileScreenHostPanelPhase {
  if (overlayOpen || (panelIndex !== activeIndex && panelIndex !== outgoingIndex)) {
    return "suspended";
  }

  if (panelIndex === activeIndex) {
    if (outgoingIndex !== null && direction !== null) {
      return direction === "next" ? "enter-next" : "enter-prev";
    }
    return "active";
  }

  if (panelIndex === outgoingIndex && direction !== null) {
    return direction === "next" ? "exit-next" : "exit-prev";
  }

  return "suspended";
}
