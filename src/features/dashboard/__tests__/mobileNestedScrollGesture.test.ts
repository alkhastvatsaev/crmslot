import {
  canConsumeVerticalScroll,
  isMobileStripCentered,
  resolveMobileScrollAxis,
} from "@/features/dashboard/mobileNestedScrollGesture";

describe("mobileNestedScrollGesture", () => {
  describe("resolveMobileScrollAxis", () => {
    it("reste neutre sous le seuil", () => {
      expect(resolveMobileScrollAxis(4, 6)).toBe("none");
    });

    it("verrouille vertical si dy domine", () => {
      expect(resolveMobileScrollAxis(4, 20)).toBe("y");
    });

    it("verrouille horizontal si dx domine", () => {
      expect(resolveMobileScrollAxis(24, 6)).toBe("x");
    });
  });

  describe("canConsumeVerticalScroll", () => {
    function scrollable(top: number, height = 200, total = 600) {
      const el = document.createElement("div");
      Object.defineProperty(el, "clientHeight", { configurable: true, value: height });
      Object.defineProperty(el, "scrollHeight", { configurable: true, value: total });
      el.scrollTop = top;
      return el;
    }

    it("bloque le swipe au milieu de liste", () => {
      const el = scrollable(200);
      expect(canConsumeVerticalScroll(el, -60)).toBe(true);
      expect(canConsumeVerticalScroll(el, 60)).toBe(true);
    });

    it("libère en bas de liste pour swipe haut", () => {
      const el = scrollable(400);
      expect(canConsumeVerticalScroll(el, -60)).toBe(false);
    });
  });

  describe("isMobileStripCentered", () => {
    it("retourne true quand le panneau centre est aligné", () => {
      const strip = document.createElement("div");
      strip.getBoundingClientRect = () =>
        ({
          left: 0,
          width: 300,
          top: 0,
          height: 400,
          right: 300,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;

      const left = document.createElement("section");
      const center = document.createElement("section");
      const right = document.createElement("section");
      center.getBoundingClientRect = () =>
        ({
          left: 16,
          width: 268,
          top: 0,
          height: 400,
          right: 284,
          bottom: 400,
          x: 16,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;
      left.getBoundingClientRect = () =>
        ({
          left: -284,
          width: 268,
          top: 0,
          height: 400,
          right: -16,
          bottom: 400,
          x: -284,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;
      right.getBoundingClientRect = () =>
        ({
          left: 316,
          width: 268,
          top: 0,
          height: 400,
          right: 584,
          bottom: 400,
          x: 316,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;

      strip.append(left, center, right);
      expect(isMobileStripCentered(strip, 1, 24)).toBe(true);
    });
  });
});
