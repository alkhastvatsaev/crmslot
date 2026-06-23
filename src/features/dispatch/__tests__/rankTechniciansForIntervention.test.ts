import {
  haversineDistanceKm,
  prioritizeDefaultAssignTechnician,
  rankTechniciansForIntervention,
} from "@/features/dispatch/rankTechniciansForIntervention";
import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import type { Technician } from "@/features/technicians";

const baseTech = (overrides: Partial<Technician> & Pick<Technician, "id">): Technician => ({
  name: overrides.name ?? "Tech",
  initial: overrides.initial ?? "T",
  vehicle: "Van",
  status: overrides.status ?? "available",
  location: overrides.location ?? { lat: 50.85, lng: 4.35 },
  ...overrides,
});

describe("rankTechniciansForIntervention", () => {
  it("orders available technicians by distance", () => {
    const technicians: Technician[] = [
      baseTech({ id: "far", location: { lat: 50.9, lng: 4.4 } }),
      baseTech({ id: "near", location: { lat: 50.8501, lng: 4.3501 } }),
    ];

    const ranked = rankTechniciansForIntervention(technicians, 50.85, 4.35);

    expect(ranked.map((r) => r.technician.id)).toEqual(["near", "far"]);
    expect(ranked[0]!.distanceKm).toBeLessThan(ranked[1]!.distanceKm);
    expect(ranked[0]!.rank).toBe(1);
  });

  it("falls back to all technicians when none are available", () => {
    const technicians: Technician[] = [
      baseTech({ id: "busy", status: "on_site", location: { lat: 50.86, lng: 4.36 } }),
    ];

    const ranked = rankTechniciansForIntervention(technicians, 50.85, 4.35);

    expect(ranked).toHaveLength(1);
    expect(ranked[0]!.technician.id).toBe("busy");
  });
});

describe("prioritizeDefaultAssignTechnician", () => {
  it("puts Mansour before other available technicians", () => {
    const defaultUid = getDefaultAssignedTechnicianUid();
    const ranked = rankTechniciansForIntervention(
      [
        baseTech({ id: "other", name: "Thomas L.", location: { lat: 50.8501, lng: 4.3501 } }),
        baseTech({
          id: "mansour",
          name: "Mansour",
          authUid: defaultUid,
          location: { lat: 50.9, lng: 4.4 },
        }),
      ],
      50.85,
      4.35
    );

    const ordered = prioritizeDefaultAssignTechnician(ranked);
    expect(ordered[0]!.technician.name).toBe("Mansour");
  });
});

describe("haversineDistanceKm", () => {
  it("returns zero for identical coordinates", () => {
    expect(haversineDistanceKm(50.85, 4.35, 50.85, 4.35)).toBe(0);
  });
});
