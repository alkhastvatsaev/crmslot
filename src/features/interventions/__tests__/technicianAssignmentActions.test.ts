import type { Intervention } from "@/features/interventions/types";
import {
  acceptTechnicianAssignmentPatch,
  acceptTechnicianAssignmentInProgressPatch,
  declineTechnicianAssignmentPatch,
  getTechnicianAssignmentUid,
  isTechnicianAssignmentAwaitingResponse,
  isTechnicianActiveFieldMission,
  matchesAssignedTechnician,
} from "@/features/interventions/technicianAssignmentActions";

function iv(partial: Partial<Intervention> & Pick<Intervention, "status">): Intervention {
  return {
    id: "x",
    title: "Test",
    address: "Rue test",
    time: "10:00",
    location: { lat: 50.8, lng: 4.35 },
    ...partial,
  };
}

describe("technicianAssignmentActions", () => {
  it("detects assignment awaiting technician response", () => {
    expect(
      isTechnicianAssignmentAwaitingResponse(
        iv({ status: "assigned", assignedTechnicianUid: "tech-1" }),
        "tech-1"
      )
    ).toBe(true);
    expect(
      isTechnicianAssignmentAwaitingResponse(
        iv({ status: "assigned", assignedTechnicianUid: "tech-2" }),
        "tech-1"
      )
    ).toBe(false);
    expect(
      isTechnicianAssignmentAwaitingResponse(
        iv({ status: "en_route", assignedTechnicianUid: "tech-1" }),
        "tech-1"
      )
    ).toBe(false);
  });

  it("accept moves to en_route", () => {
    const patch = acceptTechnicianAssignmentPatch(new Date("2026-05-16T12:00:00Z"));
    expect(patch.status).toBe("en_route");
    expect(patch.technicianAcceptedAt).toBe("2026-05-16T12:00:00.000Z");
  });

  it("getTechnicianAssignmentUid uses auth uid outside dev preview (NODE_ENV=test)", () => {
    expect(getTechnicianAssignmentUid("tech-42")).toBe("tech-42");
    expect(getTechnicianAssignmentUid(null)).toBeNull();
  });

  it("treats legacy in_progress without acceptance as awaiting response", () => {
    expect(
      isTechnicianAssignmentAwaitingResponse(
        iv({
          status: "in_progress",
          assignedTechnicianUid: "tech-1",
          technicianAcceptedAt: null,
        }),
        "tech-1"
      )
    ).toBe(true);
  });

  it("matches only exact assigned technician uid", () => {
    expect(
      matchesAssignedTechnician(
        iv({ status: "assigned", assignedTechnicianUid: "tech-1" }),
        "tech-1"
      )
    ).toBe(true);
    expect(
      matchesAssignedTechnician(
        iv({ status: "assigned", assignedTechnicianUid: "tech-assigned" }),
        "tech-other"
      )
    ).toBe(false);
  });

  it("decline returns dossier to IVANA pending queue", () => {
    const patch = declineTechnicianAssignmentPatch("tech-1", new Date("2026-05-16T12:00:00Z"));
    expect(patch.status).toBe("pending");
    expect(patch.assignedTechnicianUid).toBeNull();
    expect(patch.technicianDeclinedByUid).toBe("tech-1");
  });

  it("matchesAssignedTechnician is false when uids differ outside dev preview", () => {
    expect(
      matchesAssignedTechnician(
        iv({ status: "assigned", assignedTechnicianUid: "tech-assigned" }),
        "tech-other"
      )
    ).toBe(false);
  });

  it("matchesAssignedTechnician is false when uid or assignment is empty", () => {
    expect(matchesAssignedTechnician(iv({ status: "assigned" }), "tech-1")).toBe(false);
    expect(
      matchesAssignedTechnician(iv({ status: "assigned", assignedTechnicianUid: "tech-1" }), null)
    ).toBe(false);
  });

  it("isTechnicianAssignmentAwaitingResponse is false when not the assigned technician", () => {
    expect(
      isTechnicianAssignmentAwaitingResponse(
        iv({ status: "assigned", assignedTechnicianUid: "tech-2" }),
        "tech-1"
      )
    ).toBe(false);
  });

  it("isTechnicianActiveFieldMission correctly identifies active missions", () => {
    // Should be false if not assigned
    expect(
      isTechnicianActiveFieldMission(
        iv({ status: "en_route", assignedTechnicianUid: "tech-2" }),
        "tech-1"
      )
    ).toBe(false);

    // Should be true for en_route and waiting_material
    expect(
      isTechnicianActiveFieldMission(
        iv({ status: "en_route", assignedTechnicianUid: "tech-1" }),
        "tech-1"
      )
    ).toBe(true);
    expect(
      isTechnicianActiveFieldMission(
        iv({ status: "waiting_material", assignedTechnicianUid: "tech-1" }),
        "tech-1"
      )
    ).toBe(true);

    // Should be true for in_progress ONLY if acceptedAt is present
    expect(
      isTechnicianActiveFieldMission(
        iv({
          status: "in_progress",
          assignedTechnicianUid: "tech-1",
          technicianAcceptedAt: "2026-05-16T12:00:00Z",
        }),
        "tech-1"
      )
    ).toBe(true);
    expect(
      isTechnicianActiveFieldMission(
        iv({ status: "in_progress", assignedTechnicianUid: "tech-1", technicianAcceptedAt: null }),
        "tech-1"
      )
    ).toBe(false);

    // Should be false for other statuses
    expect(
      isTechnicianActiveFieldMission(
        iv({ status: "assigned", assignedTechnicianUid: "tech-1" }),
        "tech-1"
      )
    ).toBe(false);
  });

  it("acceptTechnicianAssignmentInProgressPatch updates status to en_route", () => {
    const patch = acceptTechnicianAssignmentInProgressPatch(new Date("2026-05-16T12:00:00Z"));
    expect(patch.status).toBe("en_route");
    expect(patch.technicianAcceptedAt).toBe("2026-05-16T12:00:00.000Z");
  });
});
