import { computeMetrics } from "@/features/technicians/components/TechnicianPerformanceDashboard";
import type { Intervention } from "@/features/interventions";

function makeIv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-" + Math.random().toString(36).slice(2, 6),
    title: "Test",
    address: "Rue Test",
    time: "10:00",
    status: "done",
    location: { lat: 50.8, lng: 4.35 },
    assignedTechnicianUid: "tech-1",
    ...partial,
  };
}

describe("computeMetrics", () => {
  it("counts assigned interventions", () => {
    const ivs = [makeIv(), makeIv(), makeIv({ assignedTechnicianUid: "other" })];
    const m = computeMetrics(ivs, "tech-1");
    expect(m.totalAssigned).toBe(2);
  });

  it("calculates completion rate", () => {
    const ivs = [
      makeIv({ status: "done" }),
      makeIv({ status: "done" }),
      makeIv({ status: "in_progress" }),
      makeIv({ status: "cancelled" }),
    ];
    const m = computeMetrics(ivs, "tech-1");
    expect(m.completionRate).toBe(50); // 2 done / 4 total
  });

  it("returns 0 completion rate for empty list", () => {
    const m = computeMetrics([], "tech-1");
    expect(m.completionRate).toBe(0);
  });

  it("counts waiting_material", () => {
    const ivs = [makeIv({ status: "waiting_material" }), makeIv({ status: "done" })];
    const m = computeMetrics(ivs, "tech-1");
    expect(m.waitingMaterial).toBe(1);
  });

  it("calculates average response time", () => {
    const ivs = [
      makeIv({
        createdAt: "2026-05-18T08:00:00Z",
        technicianAcceptedAt: "2026-05-18T08:30:00Z",
      }),
      makeIv({
        createdAt: "2026-05-18T09:00:00Z",
        technicianAcceptedAt: "2026-05-18T10:00:00Z",
      }),
    ];
    const m = computeMetrics(ivs, "tech-1");
    expect(m.avgResponseMinutes).toBe(45); // (30 + 60) / 2
  });

  it("returns null avg response when no data", () => {
    const m = computeMetrics([makeIv()], "tech-1");
    expect(m.avgResponseMinutes).toBeNull();
  });
});
