/** @jest-environment node */
import {
  computeTechnicianPerformanceScores,
  formatCompositeScore,
} from "@/features/dispatch/technicianPerformanceScores";
import type { Intervention } from "@/features/interventions/types";

const NOW = new Date("2026-06-11T12:00:00Z");
const RECENT = "2026-06-01T10:00:00Z"; // within 30d
const OLD = "2026-04-01T10:00:00Z"; // outside 30d

function iv(overrides: Partial<Intervention> & Pick<Intervention, "id" | "status">): Intervention {
  return {
    title: "Test",
    address: "Brussels",
    time: "09:00",
    location: { lat: 50.85, lng: 4.35 },
    ...overrides,
  } as Intervention;
}

describe("computeTechnicianPerformanceScores", () => {
  it("returns empty map for empty uid list", () => {
    const result = computeTechnicianPerformanceScores([], []);
    expect(result.size).toBe(0);
  });

  it("defaults completionRate to 50 when no recent interventions", () => {
    const result = computeTechnicianPerformanceScores([], ["uid-a"]);
    expect(result.get("uid-a")?.completionRate).toBe(50);
  });

  it("calculates completionRate from recent done/invoiced interventions", () => {
    const interventions: Intervention[] = [
      iv({ id: "1", status: "done", assignedTechnicianUid: "uid-a", completedAt: RECENT }),
      iv({ id: "2", status: "done", assignedTechnicianUid: "uid-a", completedAt: RECENT }),
      iv({ id: "3", status: "pending", assignedTechnicianUid: "uid-a", statusUpdatedAt: RECENT }),
      iv({ id: "4", status: "cancelled", assignedTechnicianUid: "uid-a", statusUpdatedAt: RECENT }),
    ];
    const result = computeTechnicianPerformanceScores(interventions, ["uid-a"]);
    // 2 done / 4 recent = 50%
    expect(result.get("uid-a")?.completionRate).toBe(50);
  });

  it("excludes interventions outside 30-day window", () => {
    const interventions: Intervention[] = [
      iv({ id: "1", status: "done", assignedTechnicianUid: "uid-a", completedAt: OLD }),
      iv({ id: "2", status: "done", assignedTechnicianUid: "uid-a", completedAt: RECENT }),
    ];
    const result = computeTechnicianPerformanceScores(interventions, ["uid-a"]);
    expect(result.get("uid-a")?.completedCount30d).toBe(1);
  });

  it("calculates avgTicketCents from invoiced amounts", () => {
    const interventions: Intervention[] = [
      iv({
        id: "1",
        status: "invoiced",
        assignedTechnicianUid: "uid-a",
        completedAt: RECENT,
        invoiceAmountCents: 10000,
      }),
      iv({
        id: "2",
        status: "invoiced",
        assignedTechnicianUid: "uid-a",
        completedAt: RECENT,
        invoiceAmountCents: 20000,
      }),
    ];
    const result = computeTechnicianPerformanceScores(interventions, ["uid-a"]);
    expect(result.get("uid-a")?.avgTicketCents).toBe(15000);
    expect(result.get("uid-a")?.revenueCents30d).toBe(30000);
  });

  it("calculates avgResponseMinutes when technicianAcceptedAt is set", () => {
    const interventions: Intervention[] = [
      iv({
        id: "1",
        status: "done",
        assignedTechnicianUid: "uid-a",
        completedAt: RECENT,
        createdAt: "2026-06-01T10:00:00Z",
        technicianAcceptedAt: "2026-06-01T10:30:00Z",
      }),
    ];
    const result = computeTechnicianPerformanceScores(interventions, ["uid-a"]);
    expect(result.get("uid-a")?.avgResponseMinutes).toBe(30);
  });

  it("sets avgResponseMinutes null when no accepted timestamps", () => {
    const interventions: Intervention[] = [
      iv({ id: "1", status: "done", assignedTechnicianUid: "uid-a", completedAt: RECENT }),
    ];
    const result = computeTechnicianPerformanceScores(interventions, ["uid-a"]);
    expect(result.get("uid-a")?.avgResponseMinutes).toBeNull();
  });

  it("compositeScore is capped at 100", () => {
    // 100% completion + 200€ avg ticket + instant response → max
    const interventions: Intervention[] = [
      iv({
        id: "1",
        status: "invoiced",
        assignedTechnicianUid: "uid-a",
        completedAt: RECENT,
        invoiceAmountCents: 20000,
        createdAt: "2026-06-01T10:00:00Z",
        technicianAcceptedAt: "2026-06-01T10:00:01Z",
      }),
    ];
    const result = computeTechnicianPerformanceScores(interventions, ["uid-a"]);
    const score = result.get("uid-a")!.compositeScore;
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("handles multiple technicians independently", () => {
    const interventions: Intervention[] = [
      iv({ id: "1", status: "done", assignedTechnicianUid: "uid-a", completedAt: RECENT }),
      iv({ id: "2", status: "cancelled", assignedTechnicianUid: "uid-b", statusUpdatedAt: RECENT }),
    ];
    const result = computeTechnicianPerformanceScores(interventions, ["uid-a", "uid-b"]);
    expect(result.get("uid-a")?.completionRate).toBe(100);
    expect(result.get("uid-b")?.completionRate).toBe(0);
  });
});

describe("formatCompositeScore", () => {
  it("returns Top for score >= 80", () => {
    expect(formatCompositeScore(80)).toContain("Top");
    expect(formatCompositeScore(95)).toContain("Top");
  });

  it("returns Bon for score 60-79", () => {
    expect(formatCompositeScore(60)).toBe("Bon");
    expect(formatCompositeScore(79)).toBe("Bon");
  });

  it("returns Moyen for score 40-59", () => {
    expect(formatCompositeScore(40)).toBe("Moyen");
    expect(formatCompositeScore(59)).toBe("Moyen");
  });

  it("returns Faible for score < 40", () => {
    expect(formatCompositeScore(0)).toBe("Faible");
    expect(formatCompositeScore(39)).toBe("Faible");
  });
});
