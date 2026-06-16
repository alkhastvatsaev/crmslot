import {
  assertTechnicianMayRespondToAssignment,
  assertTechnicianMayUpdateAssignedIntervention,
} from "@/features/interventions/technicianAssignmentServerAuth";
import type { Intervention } from "@/features/interventions/types";

const TECH_UID = "tech-uid-1";

function iv(
  partial: Partial<
    Pick<Intervention, "status" | "assignedTechnicianUid" | "technicianAcceptedAt">
  > = {}
): Pick<Intervention, "status" | "assignedTechnicianUid" | "technicianAcceptedAt"> {
  return {
    status: "assigned",
    assignedTechnicianUid: TECH_UID,
    ...partial,
  };
}

describe("assertTechnicianMayRespondToAssignment", () => {
  it("allows assignee when auth uid matches", () => {
    expect(assertTechnicianMayRespondToAssignment(iv(), TECH_UID)).toBe(true);
  });

  it("rejects when auth uid does not match assignee", () => {
    expect(assertTechnicianMayRespondToAssignment(iv(), "other-uid")).toBe(false);
  });

  it("rejects when status is not awaiting response", () => {
    expect(assertTechnicianMayRespondToAssignment(iv({ status: "en_route" }), TECH_UID)).toBe(
      false
    );
  });

  it("allows legacy in_progress without technicianAcceptedAt", () => {
    expect(
      assertTechnicianMayRespondToAssignment(
        iv({ status: "in_progress", technicianAcceptedAt: undefined }),
        TECH_UID
      )
    ).toBe(true);
  });

  it("allows en_route updates when auth uid matches assignee", () => {
    expect(
      assertTechnicianMayUpdateAssignedIntervention(
        iv({ status: "en_route", assignedTechnicianUid: TECH_UID }),
        TECH_UID
      )
    ).toBe(true);
  });
});
