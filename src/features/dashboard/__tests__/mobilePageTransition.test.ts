import {
  MOBILE_PAGE_TRANSITION_MS,
  computeMobileMountedPageIndices,
  computeMobilePageTransitionDirection,
  computeMobileScreenHostPanelPhase,
} from "@/features/dashboard/mobilePageTransition";

describe("mobilePageTransition", () => {
  it("expose une durée alignée sur le spring mobile", () => {
    expect(MOBILE_PAGE_TRANSITION_MS).toBe(380);
  });

  describe("computeMobilePageTransitionDirection", () => {
    it("déduit next / prev selon l'index", () => {
      expect(computeMobilePageTransitionDirection(1, 3)).toBe("next");
      expect(computeMobilePageTransitionDirection(4, 2)).toBe("prev");
      expect(computeMobilePageTransitionDirection(2, 2)).toBeNull();
    });
  });

  describe("computeMobileMountedPageIndices", () => {
    it("monte la page active seule au repos", () => {
      expect(computeMobileMountedPageIndices(2)).toEqual(new Set([2]));
      expect(computeMobileMountedPageIndices(2, null)).toEqual(new Set([2]));
    });

    it("garde l'ancienne page pendant la transition", () => {
      expect(computeMobileMountedPageIndices(3, 1)).toEqual(new Set([3, 1]));
    });
  });

  describe("computeMobileScreenHostPanelPhase", () => {
    it("assigne enter / exit selon la direction", () => {
      expect(computeMobileScreenHostPanelPhase(3, 3, 1, "next", false)).toBe("enter-next");
      expect(computeMobileScreenHostPanelPhase(1, 3, 1, "next", false)).toBe("exit-next");
      expect(computeMobileScreenHostPanelPhase(1, 1, 3, "prev", false)).toBe("enter-prev");
      expect(computeMobileScreenHostPanelPhase(3, 1, 3, "prev", false)).toBe("exit-prev");
    });

    it("reste actif sans transition en cours", () => {
      expect(computeMobileScreenHostPanelPhase(2, 2, null, null, false)).toBe("active");
    });

    it("suspend hors transition et quand l'overlay est ouvert", () => {
      expect(computeMobileScreenHostPanelPhase(0, 2, null, null, false)).toBe("suspended");
      expect(computeMobileScreenHostPanelPhase(2, 2, null, null, true)).toBe("suspended");
    });
  });
});
