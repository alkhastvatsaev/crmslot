import type { RefObject } from "react";
import { act, fireEvent, renderHook } from "@testing-library/react";
import {
  MOBILE_PAGE_SWIPE_THRESHOLD_PX,
  useMobilePageSwipe,
} from "@/features/dashboard/hooks/useMobilePageSwipe";

function swipeVertical(el: HTMLElement, startY: number, endY: number, startX = 100) {
  fireEvent.touchStart(el, { touches: [{ clientX: startX, clientY: startY }] });
  fireEvent.touchMove(el, { touches: [{ clientX: startX, clientY: endY }] });
  fireEvent.touchEnd(el, { changedTouches: [{ clientX: startX, clientY: endY }] });
}

function hostRef(): RefObject<HTMLElement | null> {
  const el = document.createElement("main");
  document.body.appendChild(el);
  return { current: el };
}

describe("useMobilePageSwipe", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("swipe haut déclenche onSwipeUp", () => {
    const ref = hostRef();
    const onUp = jest.fn();
    renderHook(() => useMobilePageSwipe(ref, onUp, jest.fn(), false));

    const delta = MOBILE_PAGE_SWIPE_THRESHOLD_PX + 10;
    act(() => {
      swipeVertical(ref.current!, 300, 300 - delta);
    });

    expect(onUp).toHaveBeenCalledTimes(1);
  });

  it("swipe bas déclenche onSwipeDown", () => {
    const ref = hostRef();
    const onDown = jest.fn();
    renderHook(() => useMobilePageSwipe(ref, jest.fn(), onDown, false));

    const delta = MOBILE_PAGE_SWIPE_THRESHOLD_PX + 10;
    act(() => {
      swipeVertical(ref.current!, 200, 200 + delta);
    });

    expect(onDown).toHaveBeenCalledTimes(1);
  });

  it("ignore les gestes quand disabled", () => {
    const ref = hostRef();
    const onUp = jest.fn();
    renderHook(() => useMobilePageSwipe(ref, onUp, jest.fn(), true));

    const delta = MOBILE_PAGE_SWIPE_THRESHOLD_PX + 10;
    act(() => {
      swipeVertical(ref.current!, 300, 300 - delta);
    });

    expect(onUp).not.toHaveBeenCalled();
  });
});
