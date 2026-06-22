import { renderHook, act } from "@testing-library/react";
import { useDocumentPageVisible } from "@/core/perf/useDocumentPageVisible";

describe("useDocumentPageVisible", () => {
  it("retourne false quand document.hidden", () => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    const { result } = renderHook(() => useDocumentPageVisible());
    expect(result.current).toBe(false);
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  it("réagit à visibilitychange", () => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    const { result } = renderHook(() => useDocumentPageVisible());
    expect(result.current).toBe(true);
    act(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current).toBe(false);
  });
});
