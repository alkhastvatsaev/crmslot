import {
  clearDevEnergyProbe,
  getDevEnergyActiveCount,
  getDevEnergyProbes,
  setDevEnergyProbe,
} from "@/features/dev/devEnergyMonitor";

describe("devEnergyMonitor", () => {
  const env = process.env.NEXT_PUBLIC_DEV_ENERGY_OVERLAY;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEV_ENERGY_OVERLAY = "true";
    clearDevEnergyProbe("a");
    clearDevEnergyProbe("b");
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEV_ENERGY_OVERLAY = env;
  });

  it("enregistre et trie les sondes actives en premier", () => {
    setDevEnergyProbe("b", { label: "B", category: "poll", active: false });
    setDevEnergyProbe("a", { label: "A", category: "webgl", active: true });
    const rows = getDevEnergyProbes();
    expect(rows[0]?.id).toBe("a");
    expect(getDevEnergyActiveCount()).toBe(1);
  });
});
