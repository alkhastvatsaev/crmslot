import type { Intervention } from "@/features/interventions/types";

export type TechnicianInvoicedAmendBlockReason = "wrong_status" | "not_assigned";

/** Consultation / modification du rapport après facturation (`invoiced`). */
export function canTechnicianAmendInvoicedReport(
  iv: Pick<Intervention, "status" | "assignedTechnicianUid">,
  technicianUid: string | null | undefined
): { allowed: true } | { allowed: false; reason: TechnicianInvoicedAmendBlockReason } {
  if (iv.status !== "invoiced") {
    return { allowed: false, reason: "wrong_status" };
  }
  const uid = (technicianUid ?? "").trim();
  const assigned = (iv.assignedTechnicianUid ?? "").trim();
  if (!uid || !assigned || assigned !== uid) {
    return { allowed: false, reason: "not_assigned" };
  }
  return { allowed: true };
}

export function hasPendingTechnicianReportAmendment(
  iv: Pick<Intervention, "technicianReportAmendedAt">
): boolean {
  return Boolean(iv.technicianReportAmendedAt?.trim());
}
