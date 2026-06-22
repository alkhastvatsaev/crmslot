import { renderHook, act } from "@testing-library/react";
import { useMobileMountedPageIndices } from "@/features/dashboard/hooks/useMobileMountedPageIndices";

describe("useMobileMountedPageIndices", () => {
  it("garde la carte montée hors page 0 (navigation fluide)", () => {
    const { result, rerender } = renderHook(({ page }) => useMobileMountedPageIndices(page), {
      initialProps: { page: 0 },
    });

    rerender({ page: 1 });
    expect(result.current.has(0)).toBe(true);
    expect(result.current.has(1)).toBe(true);
  });

  it("accumule les hubs visités", () => {
    const { result, rerender } = renderHook(({ page }) => useMobileMountedPageIndices(page), {
      initialProps: { page: 1 },
    });

    rerender({ page: 2 });
    expect(result.current.has(0)).toBe(true);
    expect(result.current.has(1)).toBe(true);
    expect(result.current.has(2)).toBe(true);
  });
});
