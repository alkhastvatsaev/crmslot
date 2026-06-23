import { getWeekDays, buildWeekCalendar, toIsoDate } from "../calendarUtils";
import type { Intervention } from "@/features/interventions";

const iv = (id: string, scheduledDate: string): Intervention =>
  ({ id, companyId: "c", status: "pending", scheduledDate }) as unknown as Intervention;

describe("getWeekDays", () => {
  it("returns 7 days", () => {
    expect(getWeekDays(new Date("2024-03-13"))).toHaveLength(7);
  });

  it("starts on Monday", () => {
    const days = getWeekDays(new Date("2024-03-15")); // Friday
    expect(days[0].getDay()).toBe(1); // Monday = 1
  });

  it("ends on Sunday", () => {
    const days = getWeekDays(new Date("2024-03-15"));
    expect(days[6].getDay()).toBe(0); // Sunday = 0
  });

  it("week of 2024-03-11 (Monday) starts on 2024-03-11", () => {
    const days = getWeekDays(new Date("2024-03-11"));
    expect(toIsoDate(days[0])).toBe("2024-03-11");
  });
});

describe("buildWeekCalendar", () => {
  const week = new Date("2024-03-13"); // Wednesday, so week = Mon 2024-03-11 → Sun 2024-03-17

  it("returns 7 CalendarDay objects", () => {
    expect(buildWeekCalendar([], week)).toHaveLength(7);
  });

  it("places intervention on correct day", () => {
    const interventions = [iv("i1", "2024-03-13"), iv("i2", "2024-03-15")];
    const cal = buildWeekCalendar(interventions, week);
    const wed = cal.find((d) => d.date === "2024-03-13");
    const fri = cal.find((d) => d.date === "2024-03-15");
    expect(wed?.interventions).toHaveLength(1);
    expect(fri?.interventions).toHaveLength(1);
  });

  it("excludes interventions outside the week", () => {
    const interventions = [iv("i1", "2024-03-20")];
    const cal = buildWeekCalendar(interventions, week);
    expect(cal.every((d) => d.interventions.length === 0)).toBe(true);
  });
});
