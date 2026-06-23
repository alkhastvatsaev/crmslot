import {
  computeBridgedTerrainVisible,
  computeInboxListMetrics,
  computePendingRequests,
  computeValidationReports,
} from "@/features/backoffice/backOfficeInboxLists";
import type { Intervention } from "@/features/interventions";

function iv(
  partial: Partial<Intervention> & { id: string; status: Intervention["status"] }
): Intervention {
  return {
    id: partial.id,
    title: "T",
    address: "A",
    time: "10:00",
    location: { lat: 1, lng: 2 },
    ...partial,
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
    const bridged = [{ interventionId: "synced", report: {} as never }];
    const synced = [iv({ id: "synced", status: "done" })];
    expect(computeBridgedTerrainVisible(bridged, synced)).toEqual([]);
  });

  it("computeInboxListMetrics switches list by tab", () => {
    const pending = [iv({ id: "p", status: "pending" })];
    const reports = [iv({ id: "r", status: "done" })];
    expect(computeInboxListMetrics("requests", pending, reports, [], 0).itemsToShow).toEqual(
      pending
    );
    const rep = computeInboxListMetrics("reports", pending, reports, [], 1);
    expect(rep.reportsTabBadgeCount).toBe(2);
    expect(rep.itemsToShow).toEqual(reports);
  });
});
