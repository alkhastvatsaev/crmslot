import { renderHook } from "@testing-library/react";
import { useMobilePanelMotionReady } from "@/features/dashboard/hooks/useMobilePanelMotionReady";

describe("useMobilePanelMotionReady", () => {
  it("active immédiatement hors phase enter", () => {
    const { result } = renderHook(() => useMobilePanelMotionReady("active"));
    expect(result.current).toBe(true);
  });

  it("planifie requestAnimationFrame sur enter", () => {
    const raf = jest.spyOn(window, "requestAnimationFrame").mockReturnValue(1);

    renderHook(() => useMobilePanelMotionReady("enter-next"));

    expect(raf).toHaveBeenCalled();
    raf.mockRestore();
  });
});
