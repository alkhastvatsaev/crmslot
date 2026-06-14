import type { TimeEntry } from "./types";
import { computeDurationMinutes } from "./types";

export type PayrollRow = {
  technicianUid: string;
  interventionId: string;
  type: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
};

export function timeEntriesToPayrollRows(entries: TimeEntry[]): PayrollRow[] {
  return entries.map((e) => ({
    technicianUid: e.technicianUid,
    interventionId: e.interventionId ?? "",
    type: e.type,
    startedAt: e.startedAt,
    endedAt: e.endedAt ?? "",
    durationMinutes:
      e.durationMinutes ?? (e.endedAt ? computeDurationMinutes(e.startedAt, e.endedAt) : 0),
  }));
}

export function payrollRowsToCsv(rows: PayrollRow[]): string {
  const header = "technicien;intervention;type;debut;fin;minutes";
  const lines = rows.map(
    (r) =>
      `${r.technicianUid};${r.interventionId};${r.type};${r.startedAt};${r.endedAt};${r.durationMinutes}`
  );
  return [header, ...lines].join("\n");
}

export function downloadPayrollCsv(entries: TimeEntry[], filename = "feuilles-temps.csv"): void {
  const csv = payrollRowsToCsv(timeEntriesToPayrollRows(entries));
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
