import { measureMapboxPerf, resolveMapboxDeviceTier } from "@/features/map/mapboxDeviceProfile";

describe("resolveMapboxDeviceTier", () => {
  it("classe low avec peu de RAM", () => {
    expect(
      resolveMapboxDeviceTier("Mozilla/5.0 (Linux; Android 12)", {
        deviceMemory: 2,
        hardwareConcurrency: 8,
      } as Navigator)
    ).toBe("low");
  });

  it("classe high sur iPhone récent", () => {
    expect(
      resolveMapboxDeviceTier("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", {
        hardwareConcurrency: 6,
      } as Navigator)
    ).toBe("high");
  });

  it("classe standard par défaut", () => {
    expect(
      resolveMapboxDeviceTier("Mozilla/5.0 (Linux; Android 13)", {
        deviceMemory: 4,
        hardwareConcurrency: 6,
      } as Navigator)
    ).toBe("standard");
  });
});

describe("measureMapboxPerf", () => {
  it("retourne un échantillon même sans marks", () => {
    const sample = measureMapboxPerf("standard");
    expect(sample.tier).toBe("standard");
    expect(sample.initMs).toBeNull();
    expect(sample.loadMs).toBeNull();
  });
});
