import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";

export function formatInterventionEmailTime(createdAt: unknown): string {
  const d = coerceFirestoreLikeDate(createdAt);
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-BE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
