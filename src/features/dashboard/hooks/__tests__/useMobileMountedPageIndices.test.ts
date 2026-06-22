import { renderHook, act } from "@testing-library/react";
import { useMobileMountedPageIndices } from "@/features/dashboard/hooks/useMobileMountedPageIndices";

describe("useMobileMountedPageIndices", () => {
  it("démonte la carte hors page 0", () => {
    const { result, rerender } = renderHook(({ page }) => useMobileMountedPageIndices(page), {
      initialProps: { page: 0 },
    });

    expect(result.current.has(0)).toBe(true);

    rerender({ page: 1 });
    expect(result.current.has(0)).toBe(false);
    expect(result.current.has(1)).toBe(true);
  });

  it("remonte la carte au retour page 0", () => {
    const { result, rerender } = renderHook(({ page }) => useMobileMountedPageIndices(page), {
      initialProps: { page: 2 },
    });

    rerender({ page: 0 });
    expect(result.current.has(0)).toBe(true);
  });
});
