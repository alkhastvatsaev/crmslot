import { act, renderHook } from "@testing-library/react";
import {
  MOBILE_MOUNTED_HUB_MAX,
  MOBILE_MOUNTED_HUB_TTL_MS,
  computeMobileMountedPageIndices,
  useMobileMountedPageIndices,
} from "@/features/dashboard/hooks/useMobileMountedPageIndices";

describe("computeMobileMountedPageIndices", () => {
  it("évince le hub le moins récent au-delà du max", () => {
    const seq = new Map([
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
    ]);
    const at = new Map([
      [1, 100],
      [2, 200],
      [3, 300],
      [4, 400],
    ]);
    const mounted = computeMobileMountedPageIndices(4, seq, at, 500);
    expect(mounted.size).toBeLessThanOrEqual(MOBILE_MOUNTED_HUB_MAX);
    expect(mounted.has(0)).toBe(true);
    expect(mounted.has(4)).toBe(true);
    expect(mounted.has(3)).toBe(true);
    expect(mounted.has(1)).toBe(false);
  });

  it("retire les hubs expirés", () => {
    const seq = new Map([
      [1, 1],
      [2, 2],
    ]);
    const at = new Map([
      [1, 0],
      [2, 100],
    ]);
    const mounted = computeMobileMountedPageIndices(2, seq, at, MOBILE_MOUNTED_HUB_TTL_MS + 1);
    expect(mounted.has(1)).toBe(false);
    expect(mounted.has(2)).toBe(true);
  });
});

describe("useMobileMountedPageIndices", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("garde la carte et la page active", () => {
    const { result } = renderHook(() => useMobileMountedPageIndices(2));
    expect(result.current.has(0)).toBe(true);
    expect(result.current.has(2)).toBe(true);
  });

  it("met à jour le set quand la page change", () => {
    const { result, rerender } = renderHook(({ page }) => useMobileMountedPageIndices(page), {
      initialProps: { page: 1 },
    });

    act(() => {
      rerender({ page: 2 });
    });

    expect(result.current.has(2)).toBe(true);
  });
});
