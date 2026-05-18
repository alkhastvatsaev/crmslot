import type { Intervention } from "@/features/interventions/types";

export interface SlaConfig {
  pendingMaxHours: number;   // alerte si pending > X heures sans technicien
  enRouteMaxHours: number;   // alerte si en_route > X heures
  inProgressMaxHours: number;
}

export const DEFAULT_SLA: SlaConfig = {
  pendingMaxHours: 2,
  enRouteMaxHours: 3,
  inProgressMaxHours: 8,
};

export type SlaStatus = "ok" | "warning" | "critical";

export interface SlaResult {
  status: SlaStatus;
  elapsedHours: number;
  maxHours: number;
  label: string;
}

export function checkSla(iv: Intervention, config: SlaConfig = DEFAULT_SLA): SlaResult | null {
  const now = Date.now();

  let since: string | null | undefined;
  let maxHours: number;

  switch (iv.status) {
    case "pending":
    case "pending_needs_address":
      since = iv.createdAt;
      maxHours = config.pendingMaxHours;
      break;
    case "en_route":
      since = iv.technicianAcceptedAt ?? iv.statusUpdatedAt;
      maxHours = config.enRouteMaxHours;
      break;
    case "in_progress":
    case "waiting_material":
      since = iv.technicianAcceptedAt ?? iv.statusUpdatedAt;
      maxHours = config.inProgressMaxHours;
      break;
    default:
      return null;
  }

  if (!since) return null;

  const elapsedMs = now - new Date(since).getTime();
  const elapsedHours = elapsedMs / 3_600_000;
  const ratio = elapsedHours / maxHours;

  const status: SlaStatus = ratio >= 1 ? "critical" : ratio >= 0.75 ? "warning" : "ok";
  const h = Math.floor(elapsedHours);
  const m = Math.floor((elapsedHours - h) * 60);
  const label = `${h}h${m.toString().padStart(2, "0")}`;

  return { status, elapsedHours, maxHours, label };
}
