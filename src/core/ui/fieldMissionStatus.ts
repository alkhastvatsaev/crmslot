import type { Intervention } from "@/features/interventions/types";

/** Pastille statut — scan rapide sans lire de label. */
export function fieldMissionStatusDotClass(status?: Intervention["status"] | string): string {
  switch (status) {
    case "pending":
    case "pending_needs_address":
      return "bg-neutral-400";
    case "assigned":
      return "bg-amber-500";
    case "en_route":
      return "bg-sky-500";
    case "on_site":
    case "in_progress":
      return "bg-violet-500";
    case "waiting_material":
      return "bg-amber-500";
    case "done":
    case "invoiced":
      return "bg-emerald-500";
    case "cancelled":
      return "bg-red-400";
    default:
      return "bg-neutral-300";
  }
}
