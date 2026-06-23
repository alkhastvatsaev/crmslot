import { resolveMapWebGLActive } from "@/features/map/mapMobileWebGLPolicy";

describe("resolveMapWebGLActive", () => {
  it("active WebGL sur mobile quand la carte est rendue", () => {
    expect(resolveMapWebGLActive(true, 0, true)).toBe(true);
  });

  it("désactive WebGL hors page carte ou rail carte non rendu", () => {
    expect(resolveMapWebGLActive(true, 1, true)).toBe(false);
    expect(resolveMapWebGLActive(true, 0, false)).toBe(false);
  });
});
