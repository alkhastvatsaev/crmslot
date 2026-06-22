import {
  applyMapboxPremiumBasemapConfig,
  isMapWebGLActive,
  resolveMapboxInitOptions,
  resolveMapboxMapRuntimeOptions,
  resolveMapboxPixelRatio,
  resolveMapCameraDuration,
} from "@/features/map/mapboxPowerProfile";

describe("mapboxPowerProfile", () => {
  it("utilise Standard sur desktop et streets-v12 sur mobile", () => {
    expect(resolveMapboxInitOptions(false).style).toContain("standard");
    expect(resolveMapboxInitOptions(true).style).toContain("streets-v12");
  });

  it("plafonne le pixel ratio", () => {
    expect(resolveMapboxPixelRatio(true, 3)).toBe(1.5);
    expect(resolveMapboxPixelRatio(false, 3)).toBe(2);
  });

  it("désactive le rendu 3D sur Standard", () => {
    const setConfigProperty = jest.fn();
    applyMapboxPremiumBasemapConfig({ setConfigProperty });
    expect(setConfigProperty).toHaveBeenCalledWith("basemap", "show3dObjects", false);
    expect(setConfigProperty).toHaveBeenCalledWith("basemap", "show3dLandmarks", false);
  });

  it("accélère les animations caméra sur mobile", () => {
    expect(resolveMapCameraDuration(true, "bounds")).toBe(0);
    expect(resolveMapCameraDuration(false, "marker")).toBeGreaterThan(400);
  });

  it("autorise WebGL lent sur Android mobile (WebView / émulateur)", () => {
    expect(
      resolveMapboxMapRuntimeOptions(true, "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36")
        .failIfMajorPerformanceCaveat
    ).toBe(false);
    expect(
      resolveMapboxMapRuntimeOptions(false, "Mozilla/5.0 (Macintosh)").failIfMajorPerformanceCaveat
    ).toBe(true);
  });

  it("coupe WebGL hors page carte ou rail centre mobile", () => {
    expect(isMapWebGLActive(false, 0, false)).toBe(true);
    expect(isMapWebGLActive(false, 2, false)).toBe(false);
    expect(isMapWebGLActive(true, 0, true)).toBe(true);
    expect(isMapWebGLActive(true, 0, false)).toBe(false);
    expect(isMapWebGLActive(true, 3, true)).toBe(false);
  });
});
