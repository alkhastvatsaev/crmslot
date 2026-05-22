import { renderHook, act } from "@testing-library/react";
import { useCrmNewEventHighlight } from "../useCrmNewEventHighlight";
import type { CrmActivityEvent } from "../../crmActivityTypes";

const ev = (id: string): CrmActivityEvent => ({
  id,
  type: "intervention_created",
  ts: Date.now(),
});

describe("useCrmNewEventHighlight", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("ne surligne pas au premier rendu", () => {
    const { result, rerender } = renderHook(
      ({ events }) => useCrmNewEventHighlight(events),
      { initialProps: { events: [ev("a")] } },
    );
    expect(result.current.size).toBe(0);
    rerender({ events: [ev("a"), ev("b")] });
    expect(result.current.has("b")).toBe(true);
  });

  it("retire la surbrillance après 8s", () => {
    const { result, rerender } = renderHook(
      ({ events }) => useCrmNewEventHighlight(events),
      { initialProps: { events: [ev("a")] } },
    );
    rerender({ events: [ev("a"), ev("b")] });
    expect(result.current.has("b")).toBe(true);
    act(() => {
      jest.advanceTimersByTime(8_500);
    });
    expect(result.current.has("b")).toBe(false);
  });
});
