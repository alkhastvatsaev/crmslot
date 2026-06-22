import { resolveMapWebGLActive } from "@/features/map/mapMobileWebGLPolicy";

describe("resolveMapWebGLActive", () => {
  it("active WebGL sur mobile quand la carte est rendue", () => {
    expect(resolveMapWebGLActive(true, 0, true, false)).toBe(true);
    expect(resolveMapWebGLActive(true, 0, true, true)).toBe(true);
  });

  it("désactive WebGL hors page carte ou rail non rendu", () => {
    expect(resolveMapWebGLActive(true, 1, true, true)).toBe(false);
    expect(resolveMapWebGLActive(true, 0, false, true)).toBe(false);
  });
});
