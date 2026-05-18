import type { Intervention } from "@/features/interventions/types";

export type CompanyKpiSnapshot = {
  pending: number;
  inProgress: number;
  done: number;
  invoiced: number;
  revenueCents: number;
  avgCloseDays: number | null;
};

const IN_PROGRESS: Intervention["status"][] = ["assigned", "en_route", "in_progress", "waiting_material"];

export function computeCompanyKpi(interventions: Intervention[]): CompanyKpiSnapshot {
  let pending = 0;
  let inProgress = 0;
  let done = 0;
  let invoiced = 0;
  let revenueCents = 0;
  const closeDays: number[] = [];

  const now = Date.now();
  for (const iv of interventions) {
    if (iv.status === "pending" || iv.status === "pending_needs_address") pending += 1;
    if (IN_PROGRESS.includes(iv.status)) inProgress += 1;
    if (iv.status === "done") done += 1;
    if (iv.status === "invoiced") {
      invoiced += 1;
      if (typeof iv.invoiceAmountCents === "number") revenueCents += iv.invoiceAmountCents;
    }
    if (iv.completedAt && iv.createdAt) {
      const created = new Date(iv.createdAt).getTime();
      const completed = new Date(iv.completedAt).getTime();
      if (Number.isFinite(created) && Number.isFinite(completed) && completed >= created) {
        closeDays.push((completed - created) / (1000 * 60 * 60 * 24));
      }
    }
  }

  const avgCloseDays =
    closeDays.length > 0 ? Math.round((closeDays.reduce((a, b) => a + b, 0) / closeDays.length) * 10) / 10 : null;

  void now;

  return { pending, inProgress, done, invoiced, revenueCents, avgCloseDays };
}
