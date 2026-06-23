import { resolveMapWebGLActive } from "@/features/map/mapMobileWebGLPolicy";

describe("resolveMapWebGLActive", () => {
  it("respecte le flag mobileMapWebGL sur mobile", () => {
    expect(resolveMapWebGLActive(true, 0, true, false)).toBe(false);
    expect(resolveMapWebGLActive(true, 0, true, true)).toBe(true);
  });

  it("désactive WebGL hors page carte ou rail non rendu", () => {
    expect(resolveMapWebGLActive(true, 1, true, true)).toBe(false);
    expect(resolveMapWebGLActive(true, 0, false, true)).toBe(false);
  });
});
