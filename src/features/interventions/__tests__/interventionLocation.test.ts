import { interventionLocationOrDefault } from "@/features/interventions/interventionLocation";

describe("interventionLocationOrDefault", () => {
  it("returns stored coordinates when valid", () => {
    expect(interventionLocationOrDefault({ location: { lat: 50.9, lng: 4.4 } })).toEqual({
      lat: 50.9,
      lng: 4.4,
    });
  });

  it("falls back to Brussels when location is missing", () => {
    expect(interventionLocationOrDefault({})).toEqual({ lat: 50.8466, lng: 4.3522 });
  });
});
