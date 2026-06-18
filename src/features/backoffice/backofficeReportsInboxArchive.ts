import type { Intervention } from "@/features/interventions/types";

type ReportInboxFields = Pick<Intervention, "status" | "backofficeReportsArchivedAt">;

export function isBackofficeReportArchivedInInbox(iv: ReportInboxFields): boolean {
  return Boolean(iv.backofficeReportsArchivedAt?.trim());
}

export function isBackofficeReportInInboxArchive(iv: ReportInboxFields): boolean {
  return (
    (iv.status === "done" || iv.status === "invoiced") && isBackofficeReportArchivedInInbox(iv)
  );
}

/** Rapports visibles dans la liste principale (hors section Archive). */
export function isBackofficeReportInInboxActiveQueue(iv: ReportInboxFields): boolean {
  return (
    (iv.status === "done" || iv.status === "invoiced") && !isBackofficeReportArchivedInInbox(iv)
  );
}

export function canArchiveBackofficeReportInInbox(iv: ReportInboxFields): boolean {
  return isBackofficeReportInInboxActiveQueue(iv);
}
