import {
  mergeInterventionTimelineEvents,
  statusEventToInterventionEvent,
} from "@/features/interventions/timeline/mergeInterventionTimeline";
import type { InterventionStatusEvent } from "@/features/interventions/workflow/interventionWorkflowTypes";

describe("mergeInterventionTimeline", () => {
  const statusEv: InterventionStatusEvent = {
    id: "s1",
    interventionId: "iv-1",
    fromStatus: "pending",
    toStatus: "assigned",
    actorUid: "dispatch-1",
    actorRole: "dispatcher",
    note: null,
    at: "2026-05-17T08:00:00.000Z",
    companyId: "co-1",
  };

  it("maps status events and sorts chronologically", () => {
    const merged = mergeInterventionTimelineEvents(
      [statusEv],
      [
        {
          id: "c1",
          data: {
            interventionId: "iv-1",
            type: "comment",
            content: "Client préfère l'après-midi",
            visibility: "internal",
            createdAt: "2026-05-17T09:00:00.000Z",
            createdByUid: "staff-1",
          },
        },
      ],
    );
    expect(merged).toHaveLength(2);
    expect(merged[0].type).toBe("status_change");
    expect(merged[1].type).toBe("comment");
    expect(merged[1].content).toContain("après-midi");
  });

  it("filters client-visible only", () => {
    const merged = mergeInterventionTimelineEvents(
      [statusEv],
      [
        {
          id: "c-internal",
          data: {
            interventionId: "iv-1",
            type: "comment",
            content: "Secret dispatch",
            visibility: "internal",
            createdAt: "2026-05-17T10:00:00.000Z",
            createdByUid: "staff-1",
          },
        },
        {
          id: "c-client",
          data: {
            interventionId: "iv-1",
            type: "comment",
            content: "Visible client",
            visibility: "client",
            createdAt: "2026-05-17T11:00:00.000Z",
            createdByUid: "staff-1",
          },
        },
      ],
      { clientVisibleOnly: true },
    );
    expect(merged.some((e) => e.content === "Secret dispatch")).toBe(false);
    expect(merged.some((e) => e.content === "Visible client")).toBe(true);
    expect(merged.some((e) => e.type === "status_change")).toBe(true);
  });

  it("statusEventToInterventionEvent carries actor role", () => {
    const row = statusEventToInterventionEvent(statusEv);
    expect(row.actorRole).toBe("dispatcher");
    expect(row.newStatus).toBe("assigned");
  });
});
