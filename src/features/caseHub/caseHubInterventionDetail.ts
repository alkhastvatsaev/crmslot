import { interventionBillingTotalCents } from "@/features/billingHub/billingHubMetrics";
import {
  readAudioStoragePath,
  readAudioUrl,
} from "@/features/backoffice/useResolvedInterventionAudio";
import { hasPendingTechnicianReportAmendment } from "@/features/interventions/technicianInvoicedReportAmend";
import { resolveInterventionClientName } from "@/features/interventions/resolveInterventionClientName";
import {
  coerceDisplayString,
  isInterventionInBackofficeRequestsQueue,
} from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions/types";
import { bucketForStatus } from "@/features/caseHub/caseHubPatronMetrics";
import type { UnifiedDrawerTab } from "@/features/interventions/components/UnifiedInterventionDrawer";

export type CaseHubAlertTone = "rose" | "amber" | "sky" | "violet" | "emerald";

export type CaseHubAlert = {
  id: string;
  tone: CaseHubAlertTone;
  labelKey: string;
  detail?: string;
};

export type CaseHubInsightTone = "rose" | "amber" | "emerald" | "sky" | "violet" | "slate";

export type CaseHubInsight = {
  id: string;
  tone: CaseHubInsightTone;
  labelKey: string;
  /** Valeur formatée à afficher en gros (ex. "4 j", "210 €", "3×"). */
  value: string;
  /** Précision additionnelle facultative (clé i18n ou texte libre via `detail`). */
  detailKey?: string;
  detail?: string;
};

export type CaseHubDetailSnapshot = {
  clientName: string;
  shortId: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  scheduleLabel: string | null;
  problemPreview: string | null;
  billingCents: number;
  commissionCents: number;
  hasBillingLines: boolean;
  paymentStatus: Intervention["paymentStatus"];
  paymentLinkUrl: string | null;
  whatsapp: string | null;
  invoicePdfUrl: string | null;
  hasAudio: boolean;
  canAssignTechnician: boolean;
  clientRating: number | null;
  clientComment: string | null;
  drawerTabBadges: Partial<Record<UnifiedDrawerTab, number>>;
  alerts: CaseHubAlert[];
  insights: CaseHubInsight[];
};

export function canCaseHubAssignTechnician(iv: Intervention): boolean {
  return isInterventionInBackofficeRequestsQueue(iv);
}

export function buildCaseHubDrawerTabBadges(
  iv: Intervention
): Partial<Record<UnifiedDrawerTab, number>> {
  const bucket = bucketForStatus(iv.status);
  const billingCents = interventionBillingTotalCents(iv);
  const payment = iv.paymentStatus ?? "unpaid";
  const badges: Partial<Record<UnifiedDrawerTab, number>> = {};

  if (bucket === "waiting") badges.materials = 1;
  if (bucket === "to_invoice" || (billingCents > 0 && payment !== "paid")) badges.billing = 1;
  if (!iv.clientId?.trim()) badges.crm = 1;
  if (iv.reportRejectionReason?.trim() || hasPendingTechnicianReportAmendment(iv)) {
    badges.timeline = 1;
  }

  return badges;
}

function formatSchedule(
  date: string | null | undefined,
  time: string | null | undefined
): string | null {
  const d = coerceDisplayString(date);
  if (!d) return null;
  const tm = coerceDisplayString(time);
  return tm ? `${d} · ${tm}` : d;
}

function readProblemPreview(iv: Intervention): string | null {
  return (
    coerceDisplayString(iv.problem) ??
    coerceDisplayString(iv.title) ??
    coerceDisplayString(iv.transcription)
  );
}

export function buildCaseHubAlerts(iv: Intervention): CaseHubAlert[] {
  const alerts: CaseHubAlert[] = [];
  const status = iv.status ?? "pending";
  const bucket = bucketForStatus(status);

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

function parseIso(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function parseScheduledDate(
  date: string | null | undefined,
  time: string | null | undefined
): Date | null {
  const d = (date ?? "").trim();
  if (!d) return null;
  const t = (time ?? "").trim();
  const iso = t ? `${d}T${t.length === 5 ? `${t}:00` : t}` : `${d}T00:00:00`;
  const parsed = new Date(iso);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function diffDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function diffHours(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60));
}

function formatDays(n: number): string {
  return `${n} j`;
}

function formatHoursOrMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.max(0, minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m.toString().padStart(2, "0")}` : `${h} h`;
}

function formatEur(cents: number): string {
  const eur = Math.round(cents / 100);
  return `${eur.toLocaleString("fr-BE")} €`;
}

export function buildCaseHubInsights(
  iv: Intervention,
  peers: Intervention[] = [],
  nowParam?: Date
): CaseHubInsight[] {
  const now = nowParam ?? new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const status = iv.status ?? "pending";
  const bucket = bucketForStatus(status);
  const insights: CaseHubInsight[] = [];

  // 1. Âge du dossier (toujours utile)
  const createdAt = parseIso(iv.createdAt);
  if (createdAt) {
    const age = Math.max(0, diffDays(createdAt, now));
    if (age >= 1) {
      const stale = bucket === "to_assign" && age >= 3;
      insights.push({
        id: "case_age",
        tone: stale ? "rose" : "slate",
        labelKey: stale ? "caseHub.insight.case_age_stale" : "caseHub.insight.case_age",
        value: formatDays(age),
      });
    }
  }

  // 2. Planning en retard ou imminent
  const scheduled = parseScheduledDate(iv.scheduledDate, iv.scheduledTime);
  if (scheduled && status !== "cancelled" && bucket !== "to_invoice" && bucket !== "invoiced") {
    const dayDelta = diffDays(
      today,
      new Date(scheduled.getFullYear(), scheduled.getMonth(), scheduled.getDate())
    );
    if (
      dayDelta < 0 &&
      (bucket === "to_assign" || bucket === "in_progress" || bucket === "waiting")
    ) {
      insights.push({
        id: "schedule_overdue",
        tone: "rose",
        labelKey: "caseHub.insight.schedule_overdue",
        value: formatDays(Math.abs(dayDelta)),
      });
    } else if (dayDelta === 0 && bucket === "to_assign") {
      insights.push({
        id: "schedule_today",
        tone: "amber",
        labelKey: "caseHub.insight.schedule_today",
        value: iv.scheduledTime?.trim() || "—",
      });
    }
  }

  // 3. Sur place depuis longtemps
  const acceptedAt = parseIso(iv.technicianAcceptedAt);
  if (status === "in_progress" && acceptedAt) {
    const minutes = Math.floor((now.getTime() - acceptedAt.getTime()) / 60000);
    if (minutes >= 90) {
      const longRun = minutes >= 180;
      insights.push({
        id: "on_site_duration",
        tone: longRun ? "amber" : "sky",
        labelKey: longRun ? "caseHub.insight.on_site_long" : "caseHub.insight.on_site",
        value: formatHoursOrMinutes(minutes),
      });
    }
  }

  // 4. À facturer depuis
  const completedAt = parseIso(iv.completedAt);
  if (bucket === "to_invoice" && completedAt) {
    const days = Math.max(0, diffDays(completedAt, now));
    if (days >= 1) {
      const stale = days >= 3;
      insights.push({
        id: "to_invoice_lag",
        tone: stale ? "rose" : "emerald",
        labelKey: stale ? "caseHub.insight.to_invoice_stale" : "caseHub.insight.to_invoice_lag",
        value: formatDays(days),
      });
    }
  }

  // 5. Impayé depuis
  const invoicedAt = parseIso(iv.invoicedAt);
  const payment = iv.paymentStatus ?? "unpaid";
  if (invoicedAt && payment !== "paid" && payment !== "refunded" && status !== "cancelled") {
    const days = Math.max(0, diffDays(invoicedAt, now));
    if (days >= 1) {
      const overdue = days >= 14;
      insights.push({
        id: "unpaid_age",
        tone: overdue ? "rose" : "sky",
        labelKey: overdue ? "caseHub.insight.unpaid_overdue" : "caseHub.insight.unpaid_age",
        value: formatDays(days),
      });
    }
  }

  // 6. Marge nette estimée (facturé − commission)
  const billing = interventionBillingTotalCents(iv);
  const commission = iv.commissionAmountCents ?? 0;
  if (billing > 0) {
    const margin = billing - commission;
    const ratio = Math.round((margin / billing) * 100);
    const tone: CaseHubInsightTone = ratio < 30 ? "amber" : ratio < 50 ? "sky" : "emerald";
    insights.push({
      id: "margin",
      tone,
      labelKey: "caseHub.insight.margin",
      value: formatEur(margin),
      detail: `${ratio}%`,
    });
  }

  // 7. Durée réelle vs prévue
  if (iv.actualDurationMinutes && iv.estimatedDurationMinutes && iv.estimatedDurationMinutes > 0) {
    const ratio = iv.actualDurationMinutes / iv.estimatedDurationMinutes;
    if (ratio >= 1.5) {
      insights.push({
        id: "duration_overrun",
        tone: "amber",
        labelKey: "caseHub.insight.duration_overrun",
        value: `${ratio.toFixed(1)}×`,
        detail: formatHoursOrMinutes(iv.actualDurationMinutes),
      });
    }
  }

  // 8. Client récurrent
  if (iv.clientId?.trim()) {
    const cid = iv.clientId.trim();
    const peerCount = peers.filter((p) => p.id !== iv.id && p.clientId?.trim() === cid).length;
    if (peerCount >= 1) {
      insights.push({
        id: "recurring_client",
        tone: "violet",
        labelKey: "caseHub.insight.recurring_client",
        value: `${peerCount + 1}`,
      });
    }
  }

  return insights;
}

export function buildCaseHubDetailSnapshot(
  iv: Intervention,
  peers: Intervention[] = [],
  now?: Date
): CaseHubDetailSnapshot {
  const billingCents = interventionBillingTotalCents(iv);
  const commissionCents = iv.commissionAmountCents ?? 0;

  return {
    clientName: resolveInterventionClientName(iv),
    shortId: iv.id.slice(-6).toUpperCase(),
    phone: coerceDisplayString(iv.clientPhone ?? iv.phone),
    email: coerceDisplayString(iv.clientEmail),
    address: coerceDisplayString(iv.address),
    scheduleLabel:
      formatSchedule(iv.scheduledDate, iv.scheduledTime) ??
      formatSchedule(iv.requestedDate, iv.requestedTime) ??
      formatSchedule(iv.date, iv.hour ?? iv.time),
    problemPreview: readProblemPreview(iv),
    billingCents,
    commissionCents,
    hasBillingLines: (iv.billingLines?.length ?? 0) > 0,
    paymentStatus: iv.paymentStatus ?? "unpaid",
    paymentLinkUrl: coerceDisplayString(iv.stripePaymentLinkUrl),
    whatsapp: coerceDisplayString(iv.clientWhatsapp),
    invoicePdfUrl: coerceDisplayString(iv.invoicePdfUrl),
    hasAudio: Boolean(readAudioUrl(iv) || readAudioStoragePath(iv)),
    canAssignTechnician: canCaseHubAssignTechnician(iv),
    clientRating: typeof iv.clientRating === "number" ? iv.clientRating : null,
    clientComment: coerceDisplayString(iv.clientComment),
    drawerTabBadges: buildCaseHubDrawerTabBadges(iv),
    alerts: buildCaseHubAlerts(iv),
    insights: buildCaseHubInsights(iv, peers, now),
  };
}
