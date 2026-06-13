import { payrollRowsToCsv, timeEntriesToPayrollRows } from "../exportPayrollCsv";
import type { TimeEntry } from "../types";

describe("exportPayrollCsv", () => {
  it("convertit les entrées en lignes CSV", () => {
    const entries: TimeEntry[] = [
      {
        id: "e1",
        companyId: "c1",
        technicianUid: "tech1",
        interventionId: "iv1",
        type: "on_site",
        startedAt: "2026-06-10T08:00:00.000Z",
        endedAt: "2026-06-10T09:00:00.000Z",
        durationMinutes: 60,
      },
    ];
    const rows = timeEntriesToPayrollRows(entries);
    const csv = payrollRowsToCsv(rows);
    expect(csv).toContain("tech1");
    expect(csv).toContain("60");
  });
});
