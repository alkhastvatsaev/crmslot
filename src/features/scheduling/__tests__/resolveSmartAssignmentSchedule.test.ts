import { makeIntervention } from "@/test-utils/factories";
import {
  addDaysYmd,
  initialAssignmentDateYmd,
  isScheduleSlotInPast,
  resolveSmartAssignmentSchedule,
} from "@/features/scheduling/resolveSmartAssignmentSchedule";

describe("resolveSmartAssignmentSchedule", () => {
  const now = new Date("2026-06-18T17:00:00");

  it("keeps explicit future override from dispatch", () => {
    const result = resolveSmartAssignmentSchedule({
      iv: makeIntervention({
        id: "iv-1",
        requestedDate: "2026-06-10",
        requestedTime: "09:00",
      }),
      technicianUid: "tech-1",
      peerInterventions: [],
      scheduleOverride: { scheduledDate: "2026-06-20", scheduledTime: "14:00" },
      now,
    });
    expect(result).toEqual({
      scheduledDate: "2026-06-20",
      scheduledTime: "14:00",
      rescheduled: true,
      originalDate: "2026-06-10",
      originalTime: "09:00",
    });
  });

  it("replanifies when client slot is in the past", () => {
    const result = resolveSmartAssignmentSchedule({
      iv: makeIntervention({
        id: "iv-late",
        requestedDate: "2026-06-17",
        requestedTime: "09:00",
      }),
      technicianUid: "tech-1",
      peerInterventions: [],
      now,
    });
    expect(result.rescheduled).toBe(true);
    expect(result.scheduledDate).toBe("2026-06-18");
    expect(result.scheduledTime).toBeTruthy();
    expect(isScheduleSlotInPast(result.scheduledDate, result.scheduledTime, now)).toBe(false);
  });

  it("picks tomorrow when today has no future slots left", () => {
    const lateEvening = new Date("2026-06-18T19:30:00");
    const result = resolveSmartAssignmentSchedule({
      iv: makeIntervention({
        id: "iv-2",
        requestedDate: "2026-06-16",
        requestedTime: "10:00",
      }),
      technicianUid: "tech-1",
      peerInterventions: [],
      now: lateEvening,
    });
    expect(result.scheduledDate).toBe(addDaysYmd("2026-06-18", 1));
    expect(result.rescheduled).toBe(true);
  });

  it("initialAssignmentDateYmd bumps stale client date to today", () => {
    expect(
      initialAssignmentDateYmd({ requestedDate: "2026-06-10", scheduledDate: null }, now)
    ).toBe("2026-06-18");
    expect(
      initialAssignmentDateYmd({ requestedDate: "2026-06-20", scheduledDate: null }, now)
    ).toBe("2026-06-20");
  });
});
