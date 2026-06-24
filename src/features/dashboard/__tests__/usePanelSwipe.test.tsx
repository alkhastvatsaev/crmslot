import { useRef } from "react";
import { render, screen } from "@/test-utils/render";
import { usePanelSwipe } from "@/features/dashboard/hooks/usePanelSwipe";

class MockPointerEvent extends Event {
  clientX: number;
  clientY: number;
  pointerId: number;
  pointerType: string;
  button: number;

  constructor(
    type: string,
    init: {
      bubbles?: boolean;
      clientX?: number;
      clientY?: number;
      pointerId?: number;
      pointerType?: string;
      button?: number;
    } = {}
  ) {
    super(type, { bubbles: init.bubbles ?? true });
    this.clientX = init.clientX ?? 0;
    this.clientY = init.clientY ?? 0;
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? "mouse";
    this.button = init.button ?? 0;
  }
}

beforeAll(() => {
  global.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
  HTMLElement.prototype.setPointerCapture = jest.fn();
  HTMLElement.prototype.releasePointerCapture = jest.fn();
});

function SwipeHost({
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
}: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  usePanelSwipe(ref, onSwipeLeft, onSwipeRight, disabled);
  return <div ref={ref} data-testid="swipe-host" />;
}

function firePointerSwipe(
  el: HTMLElement,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  el.dispatchEvent(
    new MockPointerEvent("pointerdown", {
      clientX: start.x,
      clientY: start.y,
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
    })
  );
  el.dispatchEvent(
    new MockPointerEvent("pointermove", {
      clientX: end.x,
      clientY: end.y,
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
    })
  );
  el.dispatchEvent(
    new MockPointerEvent("pointerup", {
      clientX: end.x,
      clientY: end.y,
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
    })
  );
}

describe("usePanelSwipe", () => {
  it("calls onSwipeLeft when pointer drags left", () => {
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    render(<SwipeHost onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight} />);
    firePointerSwipe(screen.getByTestId("swipe-host"), { x: 200, y: 100 }, { x: 120, y: 102 });
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("calls onSwipeRight when pointer drags right", () => {
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    render(<SwipeHost onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight} />);
    firePointerSwipe(screen.getByTestId("swipe-host"), { x: 100, y: 100 }, { x: 180, y: 100 });
    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it("ignores swipe when disabled", () => {
    const onSwipeLeft = jest.fn();
    render(<SwipeHost onSwipeLeft={onSwipeLeft} onSwipeRight={jest.fn()} disabled />);
    firePointerSwipe(screen.getByTestId("swipe-host"), { x: 200, y: 100 }, { x: 120, y: 100 });
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });
});
