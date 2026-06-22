import { parseBrusselsDateTime } from "@/core/time/parseBrusselsDateTime";
import type { Intervention } from "@/features/interventions/types";

/** Tech « en retard » : assigné/en_route, scheduledTime + LATE_THRESHOLD_MIN dépassé. */
export const LATE_THRESHOLD_MIN = 15;
/** Borne haute pour éviter de notifier indéfiniment les vieux dossiers oubliés. */
const LATE_NOTIFY_UPPER_BOUND_MIN = 8 * 60; // 8h

/** Rappels factures impayées après émission. */
export const UNPAID_REMINDER_DAYS = [7, 14] as const;
export type UnpaidReminderKey = (typeof UNPAID_REMINDER_DAYS)[number];

type LateIntervention = Pick<
  Intervention,
  | "id"
  | "status"
  | "scheduledDate"
  | "scheduledTime"
  | "assignedTechnicianUid"
  | "createdByUid"
  | "companyId"
  | "title"
  | "problem"
  | "address"
  | "lateNotificationSentAt"
>;

export type LateCandidate = {
  intervention: LateIntervention;
  minutesLate: number;
};

/**
 * Retourne les interventions où le tech est en retard et qu'on n'a pas encore
 * notifiées. On exige `status` ∈ {assigned, en_route} (pas in_progress : le tech
 * est déjà sur place ou en chemin reconnu).
 */
export function findLateInterventions(
  interventions: LateIntervention[],
  now: Date = new Date()
): LateCandidate[] {
  const candidates: LateCandidate[] = [];
  for (const iv of interventions) {
    if (iv.status !== "assigned" && iv.status !== "en_route") continue;
    if (iv.lateNotificationSentAt) continue;
    const scheduledAt = parseBrusselsDateTime(iv.scheduledDate ?? "", iv.scheduledTime ?? "");
    if (!scheduledAt) continue;
    const minutesLate = (now.getTime() - scheduledAt.getTime()) / 60_000;
    if (minutesLate < LATE_THRESHOLD_MIN) continue;
    if (minutesLate > LATE_NOTIFY_UPPER_BOUND_MIN) continue;
    candidates.push({ intervention: iv, minutesLate: Math.round(minutesLate) });
  }
  return candidates;
}

type UnpaidIntervention = Pick<
  Intervention,
  | "id"
  | "status"
  | "paymentStatus"
  | "invoicedAt"
  | "paidAt"
  | "createdByUid"
  | "companyId"
  | "title"
  | "invoiceAmountCents"
  | "unpaidReminders"
>;

export type UnpaidCandidate = {
  intervention: UnpaidIntervention;
  daysSinceInvoice: number;
  reminderKey: UnpaidReminderKey;
};

function diffInDays(later: Date, earlier: Date): number {
  return (later.getTime() - earlier.getTime()) / (24 * 3600 * 1000);
}

/**
 * Retourne les factures à relancer à J+7 et J+14 (config UNPAID_REMINDER_DAYS).
 * `invoicedAt` doit être un ISO ; on saute si déjà notifié pour cette borne ou si payé.
 */
export function findUnpaidInvoices(
  interventions: UnpaidIntervention[],
  now: Date = new Date()
): UnpaidCandidate[] {
  const candidates: UnpaidCandidate[] = [];
  for (const iv of interventions) {
    if (iv.status !== "invoiced") continue;
    if (iv.paymentStatus === "paid") continue;
    if (iv.paidAt) continue;
    const invoicedAt = iv.invoicedAt ? new Date(iv.invoicedAt) : null;
    if (!invoicedAt || Number.isNaN(invoicedAt.getTime())) continue;
    const days = diffInDays(now, invoicedAt);
    for (const key of UNPAID_REMINDER_DAYS) {
      if (days < key) continue;
      if (days >= key + 1) continue;
      if (iv.unpaidReminders?.[`j${key}`]) continue;
      candidates.push({
        intervention: iv,
        daysSinceInvoice: Math.floor(days),
        reminderKey: key,
      });
      break;
    }
  }
  return candidates;
}
