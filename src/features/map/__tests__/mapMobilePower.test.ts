import { isMapMobilePowerSave, resolveMapboxMobilePixelRatio } from "@/features/map/mapMobilePower";

describe("mapMobilePower", () => {
  it("active le mode basse conso sur iPhone", () => {
    expect(isMapMobilePowerSave("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", "")).toBe(
      true
    );
  });

  it("plafonne le pixel ratio mobile", () => {
    expect(resolveMapboxMobilePixelRatio(3)).toBe(1.5);
    expect(resolveMapboxMobilePixelRatio(1)).toBe(1);
  });
});
