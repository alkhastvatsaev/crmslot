import { createTechnicianVanMarkerElement } from "@/features/map/mapTechnicianMarkerDom";
import { MAP_DEMO_TECHNICIAN_MARKERS } from "@/features/map/mapDemoTechnicianMarkers";

describe("map technician van marker", () => {
  it("exposes Mansour at Brussels center", () => {
    expect(MAP_DEMO_TECHNICIAN_MARKERS).toHaveLength(1);
    expect(MAP_DEMO_TECHNICIAN_MARKERS[0]?.name).toBe("Mansour");
    expect(MAP_DEMO_TECHNICIAN_MARKERS[0]?.coordinates[0]).toBeCloseTo(4.35, 1);
    expect(MAP_DEMO_TECHNICIAN_MARKERS[0]?.coordinates[1]).toBeCloseTo(50.85, 1);
  });

  it("creates marker DOM with test id", () => {
    const el = createTechnicianVanMarkerElement("Mansour");
    expect(el.getAttribute("data-testid")).toBe("map-technician-marker-mansour");
    expect(el.querySelector("svg")).toBeTruthy();
  });
});
