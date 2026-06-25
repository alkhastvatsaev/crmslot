import { useRef, useState } from "react";
import { fireEvent, render, screen } from "@/test-utils/render";
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
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  usePanelSwipe(node, onSwipeLeft, onSwipeRight, disabled);
  return <div ref={setNode} data-testid="swipe-host" />;
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

function fireTouchSwipe(
  el: HTMLElement,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  fireEvent.touchStart(el, { touches: [{ clientX: start.x, clientY: start.y }] });
  fireEvent.touchMove(el, { touches: [{ clientX: end.x, clientY: end.y }] });
}

describe("usePanelSwipe", () => {
  it("calls onSwipeLeft via touch events (Android)", () => {
    const onSwipeLeft = jest.fn();
    render(<SwipeHost onSwipeLeft={onSwipeLeft} onSwipeRight={jest.fn()} />);
    fireTouchSwipe(screen.getByTestId("swipe-host"), { x: 200, y: 100 }, { x: 120, y: 100 });
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });

  it("swipe works when gesture starts on a button", () => {
    const onSwipeLeft = jest.fn();
    function Host() {
      const [node, setNode] = useState<HTMLDivElement | null>(null);
      usePanelSwipe(node, onSwipeLeft, jest.fn());
      return (
        <div ref={setNode} data-testid="swipe-host">
          <button type="button">tile</button>
        </div>
      );
    }
    render(<Host />);
    fireTouchSwipe(
      screen.getByRole("button", { name: "tile" }),
      { x: 200, y: 100 },
      { x: 120, y: 100 }
    );
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });

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

  it("does not swipe horizontally when scrolling a list vertically", () => {
    const onSwipeLeft = jest.fn();
    function Host() {
      const [node, setNode] = useState<HTMLDivElement | null>(null);
      usePanelSwipe(node, onSwipeLeft, jest.fn());
      return (
        <div ref={setNode} data-testid="swipe-host">
          <div data-testid="scroll-list" style={{ height: 80, overflowY: "auto" }}>
            <div style={{ height: 400 }}>content</div>
          </div>
        </div>
      );
    }
    render(<Host />);
    const list = screen.getByTestId("scroll-list");
    Object.defineProperty(list, "scrollHeight", { value: 400, configurable: true });
    Object.defineProperty(list, "clientHeight", { value: 80, configurable: true });
    list.scrollTop = 120;
    fireTouchSwipe(list, { x: 100, y: 100 }, { x: 108, y: 180 });
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it("swipes horizontally from a list at scroll top", () => {
    const onSwipeLeft = jest.fn();
    function Host() {
      const [node, setNode] = useState<HTMLDivElement | null>(null);
      usePanelSwipe(node, onSwipeLeft, jest.fn());
      return (
        <div ref={setNode} data-testid="swipe-host">
          <div data-testid="scroll-list" style={{ height: 80, overflowY: "auto" }}>
            <div style={{ height: 400 }}>content</div>
          </div>
        </div>
      );
    }
    render(<Host />);
    const list = screen.getByTestId("scroll-list");
    Object.defineProperty(list, "scrollHeight", { value: 400, configurable: true });
    Object.defineProperty(list, "clientHeight", { value: 80, configurable: true });
    list.scrollTop = 0;
    fireTouchSwipe(list, { x: 200, y: 100 }, { x: 120, y: 100 });
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });
});
