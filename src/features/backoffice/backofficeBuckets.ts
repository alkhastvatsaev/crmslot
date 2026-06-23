import type { Intervention } from "@/features/interventions";

export type BackofficeBucket = "pending" | "in_progress" | "done" | "invoiced";

export function interventionBackofficeBucket(status: Intervention["status"]): BackofficeBucket {
  if (status === "pending" || status === "pending_needs_address") return "pending";
  if (
    status === "assigned" ||
    status === "en_route" ||
    status === "in_progress" ||
    status === "waiting_material"
  ) {
    return "in_progress";
  }
  if (status === "cancelled") return "done";
  if (status === "done") return "done";
  return "invoiced";
}

export function backofficeBucketLabel(bucket: BackofficeBucket): string {
  switch (bucket) {
    case "pending":
      return "En attente";
    case "in_progress":
      return "En cours";
    case "done":
      return "Terminé";
    case "invoiced":
      return "Facturé";
    default:
      return bucket;
  }
}

export function backofficeRowStatusLabel(status: Intervention["status"]): string {
  if (status === "pending_needs_address") return "En attente · à compléter";
  if (status === "waiting_material") return "En attente matériel";
  if (status === "cancelled") return "Annulé";
  if (status === "en_route") return "En route";
  return backofficeBucketLabel(interventionBackofficeBucket(status));
}

export function interventionMatchesStatusBucket(
  iv: Intervention,
  bucket: BackofficeBucket
): boolean {
  return interventionBackofficeBucket(iv.status) === bucket;
}
