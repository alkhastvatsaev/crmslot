import { haversineMeters } from "../geofenceUtils";

describe("haversineMeters", () => {
  it("returns 0 for identical points", () => {
    expect(haversineMeters(50.85, 4.35, 50.85, 4.35)).toBe(0);
  });

  it("returns approximately correct distance between Brussels and Louvain", () => {
    // Brussels: 50.8503, 4.3517 — Louvain: 50.8798, 4.7005 (~27 km)
    const dist = haversineMeters(50.8503, 4.3517, 50.8798, 4.7005);
    expect(dist).toBeGreaterThan(23_000);
    expect(dist).toBeLessThan(30_000);
  });

  it("detects arrival within 200m radius", () => {
    const origin = { lat: 50.85, lng: 4.35 };
    const nearby = { lat: 50.851, lng: 4.351 }; // ~150m
    const dist = haversineMeters(origin.lat, origin.lng, nearby.lat, nearby.lng);
    expect(dist).toBeLessThan(200);
  });

  it("detects position outside 200m radius", () => {
    const origin = { lat: 50.85, lng: 4.35 };
    const far = { lat: 50.855, lng: 4.36 }; // ~800m
    const dist = haversineMeters(origin.lat, origin.lng, far.lat, far.lng);
    expect(dist).toBeGreaterThan(200);
  });
});
