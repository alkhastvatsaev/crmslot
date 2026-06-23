import { SLA_RULES, type SlaPriority } from "./slaConfig";
import type { Intervention } from "@/features/interventions";

export type SlaUrgency = "ok" | "warning" | "breach";

export interface SlaStatus {
  priority: SlaPriority;
  responseUrgency: SlaUrgency;
  completionUrgency: SlaUrgency;
  /** Overall worst urgency. */
  urgency: SlaUrgency;
  /** Hours remaining before response SLA breach (negative = breached). */
  responseHoursRemaining: number | null;
  /** Hours remaining before completion SLA breach (negative = breached). */
  completionHoursRemaining: number | null;
}

function hoursElapsed(fromIso: string, toDate: Date = new Date()): number {
  return (toDate.getTime() - new Date(fromIso).getTime()) / 3_600_000;
}

function urgencyFromRemaining(remaining: number): SlaUrgency {
  if (remaining < 0) return "breach";
  if (remaining < 1) return "warning";
  return "ok";
}

function worstUrgency(a: SlaUrgency, b: SlaUrgency): SlaUrgency {
  const order: SlaUrgency[] = ["ok", "warning", "breach"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))] ?? "ok";
}

export function computeSlaStatus(
  intervention: Intervention,
  now: Date = new Date()
): SlaStatus | null {
  const priority = (intervention.priority ?? null) as SlaPriority | null;
  if (!priority || !intervention.createdAt) return null;

  const rule = SLA_RULES[priority];
  const elapsed = hoursElapsed(intervention.createdAt, now);

  // Response SLA: time until technician is assigned
  const isResponded = !!intervention.assignedTechnicianUid || intervention.status !== "pending";
  const responseHoursRemaining = isResponded
    ? rule.responseHours - elapsed // already responded — show remaining at time of response
    : rule.responseHours - elapsed;
  const responseUrgency = isResponded ? "ok" : urgencyFromRemaining(responseHoursRemaining);

  // Completion SLA
  const isCompleted = intervention.status === "done" || intervention.status === "invoiced";
  const completionHoursRemaining = isCompleted ? 0 : rule.completionHours - elapsed;
  const completionUrgency = isCompleted ? "ok" : urgencyFromRemaining(completionHoursRemaining);

  return {
    priority,
    responseUrgency,
    completionUrgency,
    urgency: worstUrgency(responseUrgency, completionUrgency),
    responseHoursRemaining,
    completionHoursRemaining: isCompleted ? null : completionHoursRemaining,
  };
}
