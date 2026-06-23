import { interventionBillingTotalCents } from "@/features/billingHub/billingHubMetrics";
import {
  readAudioStoragePath,
  readAudioUrl,
} from "@/features/backoffice/useResolvedInterventionAudio";
import { resolveInterventionClientName } from "@/features/interventions/resolveInterventionClientName";
import { coerceDisplayString } from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions";
import {
  buildCaseHubAlerts,
  buildCaseHubDrawerTabBadges,
  canCaseHubAssignTechnician,
} from "@/features/caseHub/caseHubInterventionDetailAlerts";
import { buildCaseHubInsights } from "@/features/caseHub/caseHubInterventionDetailInsights";
import type { CaseHubDetailSnapshot } from "@/features/caseHub/caseHubInterventionDetailTypes";

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
