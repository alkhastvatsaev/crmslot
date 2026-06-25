import {
  IOS_POWER_SAVE_MIMIC_DEFAULT_FPS,
  parseIosPowerSaveMimicFps,
} from "@/core/perf/iosPowerSaveMimicPolicy";

describe("iosPowerSaveMimicPolicy", () => {
  it("active avec ?lpm=1", () => {
    expect(parseIosPowerSaveMimicFps("?lpm=1", null)).toBe(IOS_POWER_SAVE_MIMIC_DEFAULT_FPS);
  });

  it("accepte un FPS explicite", () => {
    expect(parseIosPowerSaveMimicFps("?lpm=20", null)).toBe(20);
  });

  it("lit le localStorage", () => {
    expect(parseIosPowerSaveMimicFps("", "1")).toBe(30);
    expect(parseIosPowerSaveMimicFps("", "24")).toBe(24);
  });

  it("ignore les valeurs hors plage", () => {
    expect(parseIosPowerSaveMimicFps("?lpm=5", null)).toBeNull();
    expect(parseIosPowerSaveMimicFps("?lpm=99", null)).toBeNull();
  });
});
