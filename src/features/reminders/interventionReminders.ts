import type { Intervention } from "@/features/interventions";

export type InterventionReminder = {
  id: string;
  interventionId: string;
  kind: "done_not_invoiced" | "material_pending" | "unassigned_stale";
  labelKey: string;
  severity: "warning" | "info";
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildInterventionReminders(
  interventions: Intervention[],
  nowMs = Date.now()
): InterventionReminder[] {
  const out: InterventionReminder[] = [];

  for (const iv of interventions) {
    const created = iv.createdAt ? new Date(iv.createdAt).getTime() : NaN;
    const ageDays = Number.isFinite(created) ? (nowMs - created) / DAY_MS : 0;

    if (iv.status === "done" && !iv.invoicedAt && ageDays >= 3) {
      out.push({
        id: `${iv.id}-invoice`,
        interventionId: iv.id,
        kind: "done_not_invoiced",
        labelKey: "reminders.done_not_invoiced",
        severity: "warning",
      });
    }

    if (iv.status === "waiting_material" && ageDays >= 2) {
      out.push({
        id: `${iv.id}-material`,
        interventionId: iv.id,
        kind: "material_pending",
        labelKey: "reminders.material_pending",
        severity: "info",
      });
    }

    if (
      (iv.status === "pending" || iv.status === "pending_needs_address") &&
      !iv.assignedTechnicianUid?.trim() &&
      ageDays >= 1
    ) {
      out.push({
        id: `${iv.id}-assign`,
        interventionId: iv.id,
        kind: "unassigned_stale",
        labelKey: "reminders.unassigned_stale",
        severity: "warning",
      });
    }
  }

  return out.slice(0, 12);
}
