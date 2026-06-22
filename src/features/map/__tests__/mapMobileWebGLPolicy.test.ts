import { resolveMapWebGLActive } from "@/features/map/mapMobileWebGLPolicy";

describe("resolveMapWebGLActive", () => {
  it("désactive WebGL sur mobile sans flag ultra", () => {
    expect(resolveMapWebGLActive(true, 0, true, false)).toBe(false);
  });

  it("active WebGL sur mobile en mode ultra", () => {
    expect(resolveMapWebGLActive(true, 0, true, true)).toBe(true);
  });

  it("garde WebGL desktop même sans flag mobile", () => {
    expect(resolveMapWebGLActive(false, 0, true, false)).toBe(true);
  });

  it("coupe WebGL hors page carte", () => {
    expect(resolveMapWebGLActive(false, 2, true, true)).toBe(false);
  });
});
