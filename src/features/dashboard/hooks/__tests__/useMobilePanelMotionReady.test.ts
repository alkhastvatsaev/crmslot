import { renderHook, act } from "@testing-library/react";
import { useMobilePanelMotionReady } from "@/features/dashboard/hooks/useMobilePanelMotionReady";

describe("useMobilePanelMotionReady", () => {
  beforeEach(() => {
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 1;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("active immédiatement hors phase enter", () => {
    const { result } = renderHook(() => useMobilePanelMotionReady("active"));
    expect(result.current).toBe(true);
  });

  it("retarde motion-run d'une frame sur enter", () => {
    const { result, rerender } = renderHook(({ phase }) => useMobilePanelMotionReady(phase), {
      initialProps: { phase: "active" as const },
    });

    rerender({ phase: "enter-next" });
    expect(result.current).toBe(false);

    act(() => {
      jest.runOnlyPendingTimers?.();
    });

    expect(result.current).toBe(true);
  });
});
