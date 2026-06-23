import { resolveAdminMapPageMode } from "@/features/map/resolveAdminMapPageMode";

describe("resolveAdminMapPageMode", () => {
  it("utilise lite sur mobile sans flag WebGL", () => {
    expect(resolveAdminMapPageMode(true, false)).toBe("lite");
  });

  it("utilise mapbox sur mobile avec flag WebGL", () => {
    expect(resolveAdminMapPageMode(true, true)).toBe("mapbox");
  });

  it("utilise mapbox sur desktop même sans flag", () => {
    expect(resolveAdminMapPageMode(false, false)).toBe("mapbox");
    expect(resolveAdminMapPageMode(null, false)).toBe("mapbox");
  });
});
