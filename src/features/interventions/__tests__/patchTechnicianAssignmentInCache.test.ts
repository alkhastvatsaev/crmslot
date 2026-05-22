import { QueryClient } from "@tanstack/react-query";
import { patchTechnicianAssignmentInCache } from "@/features/interventions/patchTechnicianAssignmentInCache";
import { TECHNICIAN_ASSIGNMENTS_QUERY_KEY } from "@/features/offline/technicianQueryKeys";
import type { Intervention } from "@/features/interventions/types";

describe("patchTechnicianAssignmentInCache", () => {
  it("met à jour le statut d’une mission dans le cache", () => {
    const queryClient = new QueryClient();
    const uid = "tech-1";
    const rows: Intervention[] = [
      {
        id: "iv-a",
        status: "en_route",
        assignedTechnicianUid: uid,
      } as Intervention,
      {
        id: "iv-b",
        status: "assigned",
        assignedTechnicianUid: uid,
      } as Intervention,
    ];
    queryClient.setQueryData([TECHNICIAN_ASSIGNMENTS_QUERY_KEY, uid], rows);

    patchTechnicianAssignmentInCache(queryClient, uid, "iv-a", {
      status: "in_progress",
      statusUpdatedAt: "2026-05-20T14:00:00.000Z",
    });

    const updated = queryClient.getQueryData<Intervention[]>([
      TECHNICIAN_ASSIGNMENTS_QUERY_KEY,
      uid,
    ]);
    expect(updated?.[0].status).toBe("in_progress");
    expect(updated?.[0].statusUpdatedAt).toBe("2026-05-20T14:00:00.000Z");
    expect(updated?.[1].status).toBe("assigned");
  });
});
