import { optimizeTourOrder } from "@/features/interventions/optimizeTourOrder";
import type { Intervention } from "@/features/interventions";

const base: Pick<Intervention, "status" | "location" | "title" | "address" | "time"> = {
  status: "assigned",
  location: { lat: 0, lng: 0 },
  title: "",
  address: "",
  time: "",
};

const makeMission = (id: string, lat: number, lng: number): Intervention => ({
  ...base,
  id,
  location: { lat, lng },
});

describe("optimizeTourOrder", () => {
  const start = { lat: 50.85, lng: 4.35 }; // Brussels

  it("returns missions in nearest-first order", () => {
    const a = makeMission("near", 50.852, 4.352); // ~0.3 km
    const b = makeMission("far", 50.9, 4.4); // ~5 km
    const c = makeMission("medium", 50.87, 4.36); // ~2 km

    const ordered = optimizeTourOrder([b, c, a], start);
    expect(ordered[0]?.id).toBe("near");
    expect(ordered[2]?.id).toBe("far");
  });

  it("appends missions without coordinates at the end", () => {
    const withCoords = makeMission("coords", 50.852, 4.352);
    const noCoords: Intervention = { ...base, id: "no-coords", location: { lat: 0, lng: 0 } };

    const ordered = optimizeTourOrder([noCoords, withCoords], start);
    expect(ordered[0]?.id).toBe("coords");
    expect(ordered[ordered.length - 1]?.id).toBe("no-coords");
  });

  it("handles empty list", () => {
    expect(optimizeTourOrder([], start)).toEqual([]);
  });

  it("handles single mission", () => {
    const m = makeMission("only", 50.86, 4.36);
    const result = optimizeTourOrder([m], start);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("only");
  });
});
