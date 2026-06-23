import type { QueryClient } from "@tanstack/react-query";
import type { Intervention } from "@/features/interventions/types";
import { TECHNICIAN_ASSIGNMENTS_QUERY_KEY } from "@/features/offline/technicianQueryKeys";
import { writeTerrainMissionsCache } from "@/features/offline/terrainMissionsCache";

export function applyTechnicianAssignmentsToCache(
  queryClient: QueryClient,
  technicianUid: string,
  data: Intervention[]
) {
  queryClient.setQueryData([TECHNICIAN_ASSIGNMENTS_QUERY_KEY, technicianUid], data);
  writeTerrainMissionsCache(technicianUid, data);
}
