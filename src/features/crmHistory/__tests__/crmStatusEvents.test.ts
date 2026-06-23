import { dedupeCrmEvents, statusEventToCrmEvent } from "@/features/crmHistory/crmStatusEvents";
import type { Intervention } from "@/features/interventions";
import type { InterventionStatusEvent } from "@/features/interventions/workflow/interventionWorkflowTypes";

const iv: Intervention = {
  id: "iv1",
  title: "Porte",
  address: "Rue Test",
  time: "10:00",
  status: "pending",
  location: { lat: 50, lng: 4 },
  clientName: "Dupont",
};

describe("statusEventToCrmEvent", () => {
  it("maps technician decline assigned → pending", () => {
    const evt: InterventionStatusEvent = {
      id: "e1",
      interventionId: "iv1",
      fromStatus: "assigned",
      toStatus: "pending",
      actorUid: "tech-1",
      actorRole: "technician",
      at: "2024-01-15T11:00:00Z",
    };
    const mapped = statusEventToCrmEvent(evt, new Map([["iv1", iv]]));
    expect(mapped?.type).toBe("intervention_technician_declined");
    expect(mapped?.statusBefore).toBe("assigned");
    expect(mapped?.statusAfter).toBe("pending");
  });

  it("dedupes coarse status snapshot vs status event", () => {
    const fromEvent = statusEventToCrmEvent(
      {
        id: "e2",
        interventionId: "iv1",
        fromStatus: "en_route",
        toStatus: "in_progress",
        actorUid: "tech-1",
        actorRole: "technician",
        at: "2024-01-15T12:00:00Z",
      },
      new Map([["iv1", iv]])
    )!;
    const coarse = {
      id: "iv1:status",
      type: "intervention_status" as const,
      ts: Date.parse("2024-01-15T12:00:00Z"),
      interventionId: "iv1",
      statusAfter: "in_progress",
    };
    const merged = dedupeCrmEvents([coarse, fromEvent]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe("se:e2");
  });
});
