import type { QueryClient } from "@tanstack/react-query";
import type { Intervention } from "@/features/interventions/types";
import { TECHNICIAN_ASSIGNMENTS_QUERY_KEY } from "@/features/offline/technicianQueryKeys";

/** Mise à jour optimiste d’une mission dans le cache TanStack (liste technicien). */
export function patchTechnicianAssignmentInCache(
  queryClient: QueryClient,
  technicianUid: string | null | undefined,
  interventionId: string,
  patch: Partial<Intervention>,
): void {
  const uid = (technicianUid ?? "").trim();
  const id = interventionId.trim();
  if (!uid || !id) return;

  const key = [TECHNICIAN_ASSIGNMENTS_QUERY_KEY, uid] as const;
  queryClient.setQueryData<Intervention[]>(key, (prev) => {
    if (!prev?.length) return prev;
    let changed = false;
    const next = prev.map((iv) => {
      if (iv.id !== id) return iv;
      changed = true;
      return { ...iv, ...patch };
    });
    return changed ? next : prev;
  });
}
