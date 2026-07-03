import {
  getTechnicianBlockingActiveMissions,
  getTechnicianUnclosedInterventions,
  isTechnicianAcceptAssignmentBlocked,
  isTechnicianBlockedByOpenDossiers,
} from "@/features/interventions/technicianClosureBlock";
import { makeIntervention } from "@/test-utils/factories";

describe("technicianClosureBlock", () => {
  const uid = "tech-1";

  it("returns empty when technician has only closed missions", () => {
    const rows = [
      makeIntervention({ id: "a", status: "done", assignedTechnicianUid: uid }),
      makeIntervention({ id: "b", status: "invoiced", assignedTechnicianUid: uid }),
      makeIntervention({ id: "c", status: "cancelled", assignedTechnicianUid: uid }),
    ];
    expect(getTechnicianUnclosedInterventions(rows, uid)).toEqual([]);
    expect(isTechnicianBlockedByOpenDossiers(rows, uid)).toBe(false);
  });

  it("lists unclosed missions assigned to technician", () => {
    const rows = [
      makeIntervention({
        id: "open",
        status: "in_progress",
        assignedTechnicianUid: uid,
        technicianAcceptedAt: "2026-07-03T08:00:00.000Z",
      }),
      makeIntervention({ id: "closed", status: "done", assignedTechnicianUid: uid }),
      makeIntervention({
        id: "other-tech",
        status: "en_route",
        assignedTechnicianUid: "tech-2",
      }),
    ];
    const unclosed = getTechnicianUnclosedInterventions(rows, uid);
    expect(unclosed.map((r) => r.id)).toEqual(["open"]);
  });

  it("excludes candidate mission when checking accept block", () => {
    const rows = [
      makeIntervention({ id: "only-assigned", status: "assigned", assignedTechnicianUid: uid }),
    ];
    expect(isTechnicianAcceptAssignmentBlocked(rows, uid, "only-assigned")).toBe(false);
  });

  it("does not block accept when only other assigned missions exist", () => {
    const rows = [
      makeIntervention({ id: "future", status: "assigned", assignedTechnicianUid: uid }),
      makeIntervention({ id: "new-offer", status: "assigned", assignedTechnicianUid: uid }),
    ];
    expect(isTechnicianAcceptAssignmentBlocked(rows, uid, "new-offer")).toBe(false);
  });

  it("blocks accept when another active field mission is open", () => {
    const rows = [
      makeIntervention({
        id: "active",
        status: "in_progress",
        assignedTechnicianUid: uid,
        technicianAcceptedAt: "2026-07-03T08:00:00.000Z",
      }),
      makeIntervention({ id: "new-offer", status: "assigned", assignedTechnicianUid: uid }),
    ];
    expect(isTechnicianAcceptAssignmentBlocked(rows, uid, "new-offer")).toBe(true);
    const blocking = getTechnicianBlockingActiveMissions(rows, uid, {
      excludeInterventionId: "new-offer",
    });
    expect(blocking.map((r) => r.id)).toEqual(["active"]);
  });
});
