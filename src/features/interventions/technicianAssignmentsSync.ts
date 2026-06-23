import type { MutableRefObject } from "react";
import type { QueryClient } from "@tanstack/react-query";
import type { Firestore } from "firebase/firestore";
import { logger } from "@/core/logger";
import type { Intervention } from "@/features/interventions/types";
import { TECHNICIAN_ASSIGNMENTS_QUERY_KEY } from "@/features/offline/technicianQueryKeys";
import { fetchTechnicianAssignments } from "@/features/interventions/technicianAssignmentsQuery";
import { applyTechnicianAssignmentsToCache } from "@/features/interventions/technicianAssignmentsHookCache";
import {
  interventionAssignmentPreview,
  showTechnicianNewAssignmentNotification,
} from "@/features/interventions/technicianNewAssignmentAlerts";
import { toast } from "sonner";

export function notifyTechnicianNewAssignments(rows: Intervention[]): void {
  if (rows.length === 0) return;
  const preview = interventionAssignmentPreview(rows[rows.length - 1]!);
  toast.message("Nouvelle intervention", {
    description: rows.length > 1 ? `${rows.length} nouvelles missions` : preview,
  });
  showTechnicianNewAssignmentNotification(
    "Nouvelle intervention",
    preview,
    `assignment-${rows[rows.length - 1]!.id}`
  );
}

export async function syncTechnicianAssignmentsFromServer(params: {
  db: Firestore;
  uid: string;
  queryClient: QueryClient;
  listenerHydratedRef: MutableRefObject<boolean>;
  knownAssignmentIdsRef: MutableRefObject<Set<string>>;
  onSuccess: () => void;
  onError?: (message: string) => void;
}): Promise<void> {
  const { db, uid, queryClient, listenerHydratedRef, knownAssignmentIdsRef, onSuccess, onError } =
    params;

  if (typeof document === "undefined") return;
  if (document.visibilityState !== "visible") return;

  try {
    const data = await fetchTechnicianAssignments(db, uid, { fromServer: true });
    const prev =
      queryClient.getQueryData<Intervention[]>([TECHNICIAN_ASSIGNMENTS_QUERY_KEY, uid] as const) ??
      [];
    const prevIds = new Set(prev.map((row) => row.id));
    const added = data.filter((row) => !prevIds.has(row.id));
    if (listenerHydratedRef.current && added.length > 0) {
      notifyTechnicianNewAssignments(added);
    }
    for (const row of data) {
      knownAssignmentIdsRef.current.add(row.id);
    }
    applyTechnicianAssignmentsToCache(queryClient, uid, data);
    onSuccess();
  } catch (e) {
    logger.warn("[useTechnicianAssignments] resync", {
      error: e instanceof Error ? e.message : String(e),
    });
    if (onError) {
      onError(e instanceof Error ? e.message : String(e));
    }
  }
}
