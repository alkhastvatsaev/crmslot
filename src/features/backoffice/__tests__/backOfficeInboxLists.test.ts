import {
  computeAwaitingTechnicianAcceptance,
  computeBridgedTerrainVisible,
  computeInboxListMetrics,
  computePendingRequests,
  computeValidationReports,
  isInterventionInBackofficeReportsInboxQueue,
} from "@/features/backoffice/backOfficeInboxLists";
import { isInterventionInBackofficeRequestsQueue } from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions";

function iv(
  partial: Partial<Intervention> & { id: string; status: Intervention["status"] }
): Intervention {
  const { id, ...rest } = partial;
  return {
    title: "T",
    address: "A",
    time: "10:00",
    location: { lat: 1, lng: 2 },
    ...rest,
    id,
  };
}

describe("backOfficeInboxLists", () => {
  it("computePendingRequests filters pending queue", () => {
    const rows = [iv({ id: "a", status: "pending" }), iv({ id: "b", status: "done" })];
    expect(computePendingRequests(rows).map((r) => r.id)).toEqual(["a"]);
  });

  it("computeValidationReports includes done and invoiced", () => {
    const rows = [
      iv({ id: "a", status: "done", completedAt: "2026-01-02" }),
      iv({ id: "b", status: "invoiced", completedAt: "2026-01-03" }),
      iv({ id: "c", status: "assigned" }),
    ];
    expect(computeValidationReports(rows).map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("computeBridgedTerrainVisible hides synced bridged reports", () => {
    const bridged = [
      {
        localId: "local-synced",
        interventionId: "synced",
        photoDataUrls: [],
        signaturePngDataUrl: "",
        receivedAt: 1,
      },
    ];
    const synced = [iv({ id: "synced", status: "done" })];
    expect(computeBridgedTerrainVisible(bridged, synced)).toEqual([]);
  });

  it("keeps assigned missions out of demandes and in rapports inbox", () => {
    const assigned = iv({ id: "a1", status: "assigned", assignedTechnicianUid: "tech-1" });
    const pending = iv({ id: "p1", status: "pending" });
    const done = iv({ id: "d1", status: "done" });

    expect(isInterventionInBackofficeRequestsQueue(assigned)).toBe(false);
    expect(computePendingRequests([assigned, pending]).map((r) => r.id)).toEqual(["p1"]);
    expect(computeAwaitingTechnicianAcceptance([assigned, pending, done]).map((r) => r.id)).toEqual(
      ["a1"]
    );
    expect(isInterventionInBackofficeReportsInboxQueue(assigned)).toBe(true);
    expect(isInterventionInBackofficeReportsInboxQueue(pending)).toBe(false);
  });

  it("computeInboxListMetrics switches list by tab", () => {
    const pending = [iv({ id: "p", status: "pending" })];
    const awaiting = [iv({ id: "w", status: "assigned", assignedTechnicianUid: "tech-1" })];
    const reports = [iv({ id: "r", status: "done" })];
    expect(
      computeInboxListMetrics("requests", pending, awaiting, reports, [], 0).itemsToShow
    ).toEqual(pending);
    const rep = computeInboxListMetrics("reports", pending, awaiting, reports, [], 1);
    expect(rep.reportsTabBadgeCount).toBe(3);
    expect(rep.itemsToShow).toEqual([...awaiting, ...reports]);
  });
});
