import {
  MOBILE_MOUNTED_HUB_MAX,
  computeMobileMountedPageIndices,
} from "@/features/dashboard/hooks/useMobileMountedPageIndices";
import { MOBILE_PAGE_TRANSITION_MS } from "@/features/dashboard/mobilePageTransition";

describe("computeMobileMountedPageIndices", () => {
  it("ne monte qu'une seule page hub au repos (thermique mobile)", () => {
    expect(MOBILE_MOUNTED_HUB_MAX).toBe(1);
    expect(computeMobileMountedPageIndices(3)).toEqual(new Set([3]));
    expect(computeMobileMountedPageIndices(0)).toEqual(new Set([0]));
  });

  it("conserve brièvement l'ancienne page pendant une transition", () => {
    expect(computeMobileMountedPageIndices(3, 1)).toEqual(new Set([3, 1]));
  });
});

import { act, renderHook, waitFor } from "@testing-library/react";
import { useMobileMountedPageIndices } from "@/features/dashboard/hooks/useMobileMountedPageIndices";
import { useMobilePageTransition } from "@/features/dashboard/hooks/useMobilePageTransition";

describe("useMobileMountedPageIndices", () => {
  it("synchronise le Set monté avec la page active", async () => {
    const { result, rerender } = renderHook(
      ({ pageIndex }: { pageIndex: number }) => useMobileMountedPageIndices(pageIndex),
      { initialProps: { pageIndex: 0 } }
    );

    expect(result.current).toEqual(new Set([0]));

    rerender({ pageIndex: 4 });
    await waitFor(() => {
      expect(result.current).toEqual(new Set([4]));
    });
  });
});

describe("useMobilePageTransition", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("monte les deux pages le temps de l'animation puis libère l'ancienne", async () => {
    const { result, rerender } = renderHook(
      ({ pageIndex }: { pageIndex: number }) => useMobilePageTransition(pageIndex),
      { initialProps: { pageIndex: 0 } }
    );

    expect(result.current.mountedIndices).toEqual(new Set([0]));
    expect(result.current.getPanelPhase(0, false)).toBe("active");

    rerender({ pageIndex: 2 });

    expect(result.current.mountedIndices).toEqual(new Set([2, 0]));
    expect(result.current.direction).toBe("next");
    expect(result.current.getPanelPhase(2, false)).toBe("enter-next");
    expect(result.current.getPanelPhase(0, false)).toBe("exit-next");

    act(() => {
      jest.advanceTimersByTime(MOBILE_PAGE_TRANSITION_MS);
    });

    await waitFor(() => {
      expect(result.current.mountedIndices).toEqual(new Set([2]));
      expect(result.current.outgoingIndex).toBeNull();
    });
  });
});
