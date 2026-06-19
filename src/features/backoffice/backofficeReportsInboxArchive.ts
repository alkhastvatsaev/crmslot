import type { Intervention } from "@/features/interventions/types";
import { hasPendingTechnicianReportAmendment } from "@/features/interventions/technicianInvoicedReportAmend";

type ReportInboxFields = Pick<
  Intervention,
  "status" | "backofficeReportsArchivedAt" | "technicianReportAmendedAt"
>;

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
  if (iv.status !== "done" && iv.status !== "invoiced") return false;
  if (hasPendingTechnicianReportAmendment(iv)) return true;
  return !isBackofficeReportArchivedInInbox(iv);
}

export function canArchiveBackofficeReportInInbox(iv: ReportInboxFields): boolean {
  return isBackofficeReportInInboxActiveQueue(iv);
}
