import { act, renderHook } from "@testing-library/react";
import {
  MOBILE_MOUNTED_HUB_MAX,
  computeMobileMountedPageIndices,
  useMobileMountedPageIndices,
} from "@/features/dashboard/hooks/useMobileMountedPageIndices";

describe("computeMobileMountedPageIndices", () => {
  it("ne monte que la page active (thermique)", () => {
    expect(computeMobileMountedPageIndices(4)).toEqual(new Set([4]));
    expect(computeMobileMountedPageIndices(0)).toEqual(new Set([0]));
  });

  it("démonte la carte quand un autre hub est actif", () => {
    const mounted = computeMobileMountedPageIndices(2);
    expect(mounted.has(0)).toBe(false);
    expect(mounted.has(2)).toBe(true);
    expect(mounted.size).toBe(MOBILE_MOUNTED_HUB_MAX);
  });
});

describe("useMobileMountedPageIndices", () => {
  it("suit la page active uniquement", () => {
    const { result, rerender } = renderHook(({ page }) => useMobileMountedPageIndices(page), {
      initialProps: { page: 1 },
    });

    expect(result.current).toEqual(new Set([1]));
    expect(result.current.has(0)).toBe(false);

    act(() => {
      rerender({ page: 2 });
    });

    expect(result.current).toEqual(new Set([2]));
    expect(result.current.has(1)).toBe(false);
  });
});
