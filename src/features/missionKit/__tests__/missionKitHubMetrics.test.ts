import { computeMissionKitHubMetrics } from "@/features/missionKit/missionKitHubMetrics";
import type { Intervention } from "@/features/interventions";

const now = new Date("2026-07-02T12:00:00.000Z");

function iv(partial: Partial<Intervention> & Pick<Intervention, "id">): Intervention {
  return {
    id: partial.id,
    title: partial.title ?? "Intervention",
    address: "Bruxelles",
    time: "10:00",
    status: partial.status ?? "done",
    location: { lat: 0, lng: 0 },
    createdAt: partial.createdAt ?? "2026-07-01T10:00:00.000Z",
    problem: partial.problem ?? "Cylindre bloqué",
    category: partial.category ?? "serrurerie",
    ...partial,
  };
}

describe("computeMissionKitHubMetrics", () => {
  it("calcule le pourcentage de kits complets sur 30j", () => {
    const interventions = [
      iv({ id: "a", problem: "Cylindre bloqué" }),
      iv({ id: "b", problem: "Porte blindée ne ferme plus" }),
      iv({ id: "old", createdAt: "2025-01-01T00:00:00.000Z" }),
      iv({ id: "cancel", status: "cancelled" }),
      iv({ id: "wait", status: "waiting_material" }),
    ];
    const warehouse = [
      {
        id: "s1",
        companyId: "c1",
        reference: "CYL-EURO-3035",
        description: "Cylindre européen 30/35",
        quantity: 5,
        alertThreshold: 1,
        unit: "pce",
        updatedAt: "2026-01-01",
      },
      {
        id: "s2",
        companyId: "c1",
        reference: "SERR-3PT",
        description: "Serrure 3 points",
        quantity: 2,
        alertThreshold: 1,
        unit: "pce",
        updatedAt: "2026-01-01",
      },
    ];

    const metrics = computeMissionKitHubMetrics(interventions, warehouse, now);
    expect(metrics.evaluated30d).toBe(3);
    expect(metrics.waitingMaterialJobs).toBe(1);
    expect(metrics.completePct30d).toBeGreaterThanOrEqual(0);
    expect(metrics.completePct30d).toBeLessThanOrEqual(100);
  });
});
