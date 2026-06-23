import { interventionBillingTotalCents } from "@/features/billingHub/billingHubMetrics";
import { hasPendingTechnicianReportAmendment } from "@/features/interventions/technicianInvoicedReportAmend";
import { isInterventionInBackofficeRequestsQueue } from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions";
import { bucketForIntervention } from "@/features/caseHub/caseHubPatronMetrics";
import type { UnifiedDrawerTab } from "@/features/interventions";
import type { CaseHubAlert } from "@/features/caseHub/caseHubInterventionDetailTypes";

export function canCaseHubAssignTechnician(iv: Intervention): boolean {
  return isInterventionInBackofficeRequestsQueue(iv);
}

export function buildCaseHubDrawerTabBadges(
  iv: Intervention
): Partial<Record<UnifiedDrawerTab, number>> {
  const bucket = bucketForIntervention(iv);
  const billingCents = interventionBillingTotalCents(iv);
  const payment = iv.paymentStatus ?? "unpaid";
  const badges: Partial<Record<UnifiedDrawerTab, number>> = {};

  if (bucket === "waiting") badges.materials = 1;
  if (bucket === "to_invoice" || (billingCents > 0 && payment !== "paid" && bucket !== "paid"))
    badges.billing = 1;
  if (!iv.clientId?.trim()) badges.crm = 1;
  if (iv.reportRejectionReason?.trim() || hasPendingTechnicianReportAmendment(iv)) {
    badges.timeline = 1;
  }

  return badges;
}

export function buildCaseHubAlerts(iv: Intervention): CaseHubAlert[] {
  const alerts: CaseHubAlert[] = [];
  const status = iv.status ?? "pending";
  const bucket = bucketForIntervention({ status, paymentStatus: iv.paymentStatus });

  if (iv.urgency) {
    alerts.push({ id: "urgency", tone: "rose", labelKey: "caseHub.alert.urgency" });
  }
  if (status === "pending_needs_address") {
    alerts.push({ id: "needs_address", tone: "amber", labelKey: "caseHub.alert.needs_address" });
  }
  if (status === "waiting_material") {
    alerts.push({
      id: "waiting_material",
      tone: "amber",
      labelKey: "caseHub.alert.waiting_material",
    });
  }
  if (!iv.assignedTechnicianUid?.trim() && bucket === "to_assign") {
    alerts.push({ id: "no_technician", tone: "rose", labelKey: "caseHub.alert.no_technician" });
  }
  if (iv.reportRejectionReason?.trim()) {
    alerts.push({
      id: "report_rejected",
      tone: "rose",
      labelKey: "caseHub.alert.report_rejected",
      detail: iv.reportRejectionReason.trim(),
    });
  }
  if (hasPendingTechnicianReportAmendment(iv)) {
    alerts.push({ id: "report_amended", tone: "violet", labelKey: "caseHub.alert.report_amended" });
  }
  if (bucket === "to_invoice" && !iv.invoiceAmountCents && !(iv.billingLines?.length ?? 0)) {
    alerts.push({ id: "to_invoice", tone: "emerald", labelKey: "caseHub.alert.to_invoice" });
  }
  const billingCents = interventionBillingTotalCents(iv);
  const payment = iv.paymentStatus ?? "unpaid";
  if (billingCents > 0 && (payment === "unpaid" || !payment) && status !== "cancelled") {
    alerts.push({ id: "unpaid", tone: "sky", labelKey: "caseHub.alert.unpaid" });
  }
  if (payment === "pending") {
    alerts.push({ id: "payment_pending", tone: "sky", labelKey: "caseHub.alert.payment_pending" });
  }
  if (typeof iv.clientRating === "number" && iv.clientRating > 0) {
    alerts.push({
      id: "client_rating",
      tone: "emerald",
      labelKey: "caseHub.alert.client_rating",
      detail: iv.clientComment?.trim() || `${iv.clientRating}/5`,
    });
  }
  if (!iv.clientId?.trim()) {
    alerts.push({ id: "crm_unlinked", tone: "sky", labelKey: "caseHub.alert.crm_unlinked" });
  }

  return alerts;
}
