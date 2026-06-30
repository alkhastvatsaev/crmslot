import { fireEvent } from "@testing-library/react";

/** Swipe tactile simulé (pointer events) — aligné sur `usePanelSwipe`. */
export function swipePointer(el: HTMLElement, startX: number, endX: number, clientY = 200) {
  fireEvent.pointerDown(el, { clientX: startX, clientY, pointerId: 1, pointerType: "touch" });
  fireEvent.pointerMove(el, { clientX: endX, clientY, pointerId: 1, pointerType: "touch" });
}

export function swipeLeft(el: HTMLElement, clientY = 200) {
  swipePointer(el, 220, 120, clientY);
}

export function swipeRight(el: HTMLElement, clientY = 200) {
  swipePointer(el, 120, 220, clientY);
}
