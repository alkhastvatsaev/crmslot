import {
  actorMayTransition,
  buildStatusTransitionPatch,
  canTransitionInterventionStatus,
  resolveOwnerAfterTransition,
  statusChangeNotificationTargets,
} from "@/features/interventions/workflow/interventionWorkflow";

describe("interventionWorkflow", () => {
  it("allows assigned → en_route and blocks assigned → done", () => {
    expect(canTransitionInterventionStatus("assigned", "en_route")).toBe(true);
    expect(canTransitionInterventionStatus("assigned", "done")).toBe(false);
  });

  it("allows waiting_material round-trip", () => {
    expect(canTransitionInterventionStatus("in_progress", "waiting_material")).toBe(true);
    expect(canTransitionInterventionStatus("waiting_material", "in_progress")).toBe(true);
  });

  it("assigns technician owner after assign", () => {
    const owner = resolveOwnerAfterTransition("assigned", {
      assignedTechnicianUid: "tech-1",
      createdByUid: "creator-1",
    });
    expect(owner).toEqual({ currentOwnerUid: "tech-1", currentOwnerRole: "technician" });
  });

  it("returns dispatcher owner after done", () => {
    const owner = resolveOwnerAfterTransition("done", {
      assignedTechnicianUid: "tech-1",
      createdByUid: "creator-1",
    });
    expect(owner.currentOwnerRole).toBe("dispatcher");
    expect(owner.currentOwnerUid).toBeNull();
  });

  it("buildStatusTransitionPatch merges extra fields", () => {
    const patch = buildStatusTransitionPatch({
      fromStatus: "assigned",
      toStatus: "en_route",
      iv: { assignedTechnicianUid: "tech-1", createdByUid: null },
      now: new Date("2026-05-17T10:00:00.000Z"),
      extraPatch: { technicianAcceptedAt: "2026-05-17T10:00:00.000Z" },
    });
    expect(patch.status).toBe("en_route");
    expect(patch.currentOwnerUid).toBe("tech-1");
    expect(patch.technicianAcceptedAt).toBe("2026-05-17T10:00:00.000Z");
  });

  it("allows technician to reopen done → in_progress", () => {
    expect(canTransitionInterventionStatus("done", "in_progress")).toBe(true);
    expect(
      actorMayTransition({ uid: "t1", role: "technician" }, "done", "in_progress"),
    ).toBe(true);
    const owner = resolveOwnerAfterTransition("in_progress", {
      assignedTechnicianUid: "tech-1",
      createdByUid: "creator-1",
    });
    expect(owner).toEqual({ currentOwnerUid: "tech-1", currentOwnerRole: "technician" });
  });

  it("restricts technician transitions", () => {
    expect(
      actorMayTransition(
        { uid: "t1", role: "technician" },
        "en_route",
        "in_progress",
      ),
    ).toBe(true);
    expect(
      actorMayTransition(
        { uid: "t1", role: "technician" },
        "pending",
        "assigned",
      ),
    ).toBe(false);
    expect(
      actorMayTransition(
        { uid: "d1", role: "dispatcher" },
        "pending",
        "assigned",
      ),
    ).toBe(true);
  });

  it("notifies assignee on assignment", () => {
    const targets = statusChangeNotificationTargets(
      { assignedTechnicianUid: "tech-1", createdByUid: "client-1" },
      "assigned",
      "dispatcher-1",
    );
    expect(targets).toContain("tech-1");
    expect(targets).not.toContain("dispatcher-1");
  });
});
