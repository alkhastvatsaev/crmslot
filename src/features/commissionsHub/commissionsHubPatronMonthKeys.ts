import type { ManualCommissionEntry } from "@/features/commissions/commissionFirestore";
import { interventionBillingTotalCents } from "@/features/billingHub/billingHubMetrics";
import type { Intervention } from "@/features/interventions/types";
import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";

const TECHNICIAN_REVENUE_STATUSES: Intervention["status"][] = ["done", "invoiced"];

export function monthKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function parseMonthKey(value: unknown): string | null {
  if (value == null) return null;

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 7);
    const t = Date.parse(raw);
    if (Number.isNaN(t)) return null;
    return monthKeyFromDate(new Date(t));
  }

  const d = coerceFirestoreLikeDate(value);
  return d ? monthKeyFromDate(d) : null;
}

export function interventionCommissionMonth(iv: Intervention): string | null {
  return (
    parseMonthKey(iv.invoicedAt) ??
    parseMonthKey(iv.paidAt) ??
    parseMonthKey(iv.completedAt) ??
    parseMonthKey(iv.createdAt)
  );
}

export function interventionRevenueMonth(iv: Intervention): string | null {
  return (
    parseMonthKey(iv.completedAt) ??
    parseMonthKey(iv.invoicedAt) ??
    parseMonthKey(iv.paidAt) ??
    parseMonthKey(iv.createdAt)
  );
}

export function interventionTechnicianRevenueCents(iv: Intervention): number {
  if (!(iv.assignedTechnicianUid ?? "").trim()) return 0;
  if (!TECHNICIAN_REVENUE_STATUSES.includes(iv.status)) return 0;
  const cents = interventionBillingTotalCents(iv);
  return cents > 0 ? cents : 0;
}

export function manualEntryMonth(entry: ManualCommissionEntry): string | null {
  return parseMonthKey(entry.date);
}
