import { geofenceArrivalNextStatus } from "../geofenceArrival";

describe("geofenceArrivalNextStatus", () => {
  it("transitions en_route → in_progress on confirmed arrival", () => {
    expect(geofenceArrivalNextStatus("en_route")).toBe("in_progress");
  });

  it("transitions assigned → en_route (départ oublié)", () => {
    expect(geofenceArrivalNextStatus("assigned")).toBe("en_route");
  });

  it.each(["pending", "in_progress", "done", "invoiced", "cancelled"] as const)(
    "returns null for non-arrival status %s",
    (status) => {
      expect(geofenceArrivalNextStatus(status)).toBeNull();
    }
  );
});
