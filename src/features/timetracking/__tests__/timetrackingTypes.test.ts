import {
  computeDurationMinutes,
  formatDuration,
  totalDurationByType,
  type TimeEntry,
} from "../types";

describe("computeDurationMinutes", () => {
  it("computes 90 minutes", () => {
    const start = "2024-01-01T08:00:00.000Z";
    const end = "2024-01-01T09:30:00.000Z";
    expect(computeDurationMinutes(start, end)).toBe(90);
  });

  it("rounds correctly", () => {
    const start = "2024-01-01T08:00:00.000Z";
    const end = "2024-01-01T08:00:59.000Z";
    expect(computeDurationMinutes(start, end)).toBe(1);
  });
});

describe("formatDuration", () => {
  it("formats minutes only", () => {
    expect(formatDuration(45)).toBe("45 min");
  });

  it("formats exact hours", () => {
    expect(formatDuration(120)).toBe("2h");
  });

  it("formats hours + minutes", () => {
    expect(formatDuration(90)).toBe("1h30");
  });
});

describe("totalDurationByType", () => {
  const entries: TimeEntry[] = [
    { id: "1", companyId: "c", technicianUid: "u", type: "travel", startedAt: "2024-01-01T08:00:00Z", durationMinutes: 30 },
    { id: "2", companyId: "c", technicianUid: "u", type: "on_site", startedAt: "2024-01-01T08:30:00Z", durationMinutes: 60 },
    { id: "3", companyId: "c", technicianUid: "u", type: "on_site", startedAt: "2024-01-01T09:30:00Z", durationMinutes: 45 },
    { id: "4", companyId: "c", technicianUid: "u", type: "break", startedAt: "2024-01-01T10:15:00Z", durationMinutes: null },
  ];

  it("sums by type", () => {
    const totals = totalDurationByType(entries);
    expect(totals.travel).toBe(30);
    expect(totals.on_site).toBe(105);
    expect(totals.admin).toBe(0);
    expect(totals.break).toBe(0);
  });
});
