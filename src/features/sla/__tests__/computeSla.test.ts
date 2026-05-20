import { computeSlaStatus } from "../computeSla";
import type { Intervention } from "@/features/interventions/types";

const base: Intervention = {
  id: "i-1",
  title: "Test",
  address: "Bruxelles",
  time: "09:00",
  status: "pending",
  location: { lat: 50.85, lng: 4.35 },
  createdAt: "2026-05-18T08:00:00.000Z",
  priority: "high",
};

describe("computeSlaStatus", () => {
  it("returns null when no priority", () => {
    expect(computeSlaStatus({ ...base, priority: null })).toBeNull();
  });

  it("returns null when no createdAt", () => {
    expect(computeSlaStatus({ ...base, createdAt: undefined })).toBeNull();
  });

  it("returns ok when within SLA (high = 8h response, 24h completion)", () => {
    const now = new Date("2026-05-18T10:00:00.000Z"); // 2h elapsed
    const sla = computeSlaStatus(base, now)!;
    expect(sla.urgency).toBe("ok");
    expect(sla.priority).toBe("high");
    expect(sla.responseHoursRemaining).toBeCloseTo(6, 0);
  });

  it("returns warning when < 1h remaining", () => {
    const now = new Date("2026-05-18T15:30:00.000Z"); // 7.5h elapsed, 0.5h remaining
    const sla = computeSlaStatus(base, now)!;
    expect(sla.responseUrgency).toBe("warning");
  });

  it("returns breach when SLA elapsed", () => {
    const now = new Date("2026-05-19T08:00:00.000Z"); // 24h elapsed, high = 8h
    const sla = computeSlaStatus(base, now)!;
    expect(sla.urgency).toBe("breach");
  });

  it("returns ok when intervention is done", () => {
    const done = { ...base, status: "done" as const };
    const now = new Date("2026-05-20T08:00:00.000Z");
    const sla = computeSlaStatus(done, now)!;
    expect(sla.completionUrgency).toBe("ok");
  });

  it("urgent priority has 2h response SLA", () => {
    const urgent = { ...base, priority: "urgent" as const };
    const now = new Date("2026-05-18T09:30:00.000Z"); // 1.5h elapsed
    const sla = computeSlaStatus(urgent, now)!;
    expect(sla.responseUrgency).toBe("warning");
  });
});
