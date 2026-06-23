import { buildMonthGrid, localDayKeyFromParts } from "@/features/calendar/calendarGrid";

describe("calendar grid", () => {
  it("buildMonthGrid pads with leading nulls so day 1 lands on the right weekday (Mon-first)", () => {
    // June 2026: 1st is a Monday → no padding
    const june = buildMonthGrid(2026, 5);
    expect(june[0]).toBe(1);
    // Total slots is days + leading pad; June has 30 days → no pad
    expect(june.filter((c) => typeof c === "number")).toHaveLength(30);
  });

  it("buildMonthGrid pads correctly for a month not starting on Monday", () => {
    // January 2026: 1st is a Thursday → pad = 3 leading nulls
    const jan = buildMonthGrid(2026, 0);
    expect(jan[0]).toBeNull();
    expect(jan[1]).toBeNull();
    expect(jan[2]).toBeNull();
    expect(jan[3]).toBe(1);
  });

  it("localDayKeyFromParts produces zero-padded YYYY-MM-DD", () => {
    expect(localDayKeyFromParts(2026, 0, 3)).toBe("2026-01-03");
    expect(localDayKeyFromParts(2026, 11, 31)).toBe("2026-12-31");
  });
});
