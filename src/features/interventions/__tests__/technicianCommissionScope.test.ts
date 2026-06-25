import type { ManualCommissionEntry } from "@/features/commissions";
import type { Intervention } from "@/features/interventions/types";
import type { Technician } from "@/features/technicians";
import {
  filterInterventionsForTechnicianCommission,
  filterManualEntriesForTechnicianCommission,
  interventionOpenForTerrainPhotos,
} from "@/features/interventions/technicianCommissionScope";

const baseIv = (overrides: Partial<Intervention> = {}): Intervention =>
  ({
    id: "iv-1",
    status: "in_progress",
    assignedTechnicianUid: "auth-uid-1",
    ...overrides,
  }) as Intervention;

const tech = (overrides: Partial<Technician> = {}): Technician =>
  ({
    id: "tech-doc-1",
    name: "Jean",
    initial: "J",
    authUid: "auth-uid-1",
    companyId: "co-1",
    active: true,
    ...overrides,
  }) as Technician;

describe("interventionOpenForTerrainPhotos", () => {
  it("returns true for active missions", () => {
    expect(interventionOpenForTerrainPhotos(baseIv({ status: "in_progress" }))).toBe(true);
    expect(interventionOpenForTerrainPhotos(baseIv({ status: "en_route" }))).toBe(true);
  });

  it("returns false for closed missions", () => {
    expect(interventionOpenForTerrainPhotos(baseIv({ status: "done" }))).toBe(false);
    expect(interventionOpenForTerrainPhotos(baseIv({ status: "invoiced" }))).toBe(false);
    expect(interventionOpenForTerrainPhotos(baseIv({ status: "cancelled" }))).toBe(false);
  });
});

describe("filterInterventionsForTechnicianCommission", () => {
  it("keeps interventions assigned via auth uid or doc id", () => {
    const interventions = [
      baseIv({ id: "a", assignedTechnicianUid: "auth-uid-1" }),
      baseIv({ id: "b", assignedTechnicianUid: "tech-doc-1" }),
      baseIv({ id: "c", assignedTechnicianUid: "other" }),
    ];
    const filtered = filterInterventionsForTechnicianCommission(interventions, "auth-uid-1", [
      tech(),
    ]);
    expect(filtered.map((iv) => iv.id)).toEqual(["a", "b"]);
  });
});

describe("filterManualEntriesForTechnicianCommission", () => {
  it("keeps manual bonuses for the technician aliases", () => {
    const entries: ManualCommissionEntry[] = [
      {
        id: "1",
        technicianUid: "auth-uid-1",
        amountEuros: 10,
        reason: "bonus",
        date: "2026-06-01",
        createdByUid: "admin",
        createdAt: "2026-06-01T10:00:00.000Z",
      },
      {
        id: "2",
        technicianUid: "tech-doc-1",
        amountEuros: 5,
        reason: "bonus",
        date: "2026-06-02",
        createdByUid: "admin",
        createdAt: "2026-06-02T10:00:00.000Z",
      },
      {
        id: "3",
        technicianUid: "other",
        amountEuros: 1,
        reason: "bonus",
        date: "2026-06-03",
        createdByUid: "admin",
        createdAt: "2026-06-03T10:00:00.000Z",
      },
    ];
    const filtered = filterManualEntriesForTechnicianCommission(entries, "auth-uid-1", [tech()]);
    expect(filtered.map((e) => e.id)).toEqual(["1", "2"]);
  });
});
