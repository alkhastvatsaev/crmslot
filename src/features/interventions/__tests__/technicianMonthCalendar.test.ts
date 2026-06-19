import type { Intervention } from "@/features/interventions/types";
import {
  buildCalendarMonthCells,
  buildTechnicianMissionDaySummaries,
  resolveTechnicianMonthDayTone,
  startOfCalendarMonth,
} from "@/features/interventions/technicianMonthCalendar";

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-cal-1",
    title: "Test",
    address: "Rue test",
    time: "10:00",
    status: "en_route",
    location: { lat: 50.8, lng: 4.35 },
    assignedTechnicianUid: "tech-1",
    technicianAcceptedAt: "2026-05-16T08:00:00.000Z",
    scheduledDate: "2026-06-20",
    scheduledTime: "09:00",
    ...partial,
  };
}

describe("technicianMonthCalendar", () => {
  it("builds month cells without trailing days from next month", () => {
    const june = buildCalendarMonthCells(new Date("2026-06-01T12:00:00"));
    expect(june.filter((c) => c.inMonth)).toHaveLength(30);
    expect(june.some((c) => c.inMonth && c.ymd.startsWith("2026-07"))).toBe(false);
    expect(june).toHaveLength(30);

    const may = buildCalendarMonthCells(new Date("2026-05-01T12:00:00"));
    expect(may.filter((c) => c.inMonth)).toHaveLength(31);
    expect(may.filter((c) => !c.inMonth)).toHaveLength(4);
  });

  it("aggregates missions per scheduled day", () => {
    const map = buildTechnicianMissionDaySummaries(
      [
        iv({ id: "a", status: "en_route" }),
        iv({ id: "b", status: "done", scheduledDate: "2026-06-21", scheduledTime: "11:00" }),
        iv({
          id: "c",
          status: "assigned",
          technicianAcceptedAt: null,
          scheduledDate: "2026-06-22",
          scheduledTime: "14:00",
        }),
      ],
      "tech-1"
    );

    expect(map.get("2026-06-20")).toEqual({ total: 1, pending: 1, completed: 0, awaiting: 0 });
    expect(map.get("2026-06-21")).toEqual({ total: 1, pending: 0, completed: 1, awaiting: 0 });
    expect(map.get("2026-06-22")).toEqual({ total: 1, pending: 0, completed: 0, awaiting: 1 });
  });

  it("resolves day tone from summary", () => {
    expect(resolveTechnicianMonthDayTone(undefined)).toBe("empty");
    expect(resolveTechnicianMonthDayTone({ total: 1, pending: 1, completed: 0, awaiting: 0 })).toBe(
      "scheduled"
    );
    expect(resolveTechnicianMonthDayTone({ total: 2, pending: 1, completed: 1, awaiting: 0 })).toBe(
      "mixed"
    );
  });

  it("starts month on first day", () => {
    const start = startOfCalendarMonth(new Date("2026-06-19T15:00:00"));
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(5);
  });
});
