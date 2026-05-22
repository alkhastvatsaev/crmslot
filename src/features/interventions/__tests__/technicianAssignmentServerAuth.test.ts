import {
  assertTechnicianMayRespondToAssignment,
  assertTechnicianMayUpdateAssignedIntervention,
} from "@/features/interventions/technicianAssignmentServerAuth";
import type { Intervention } from "@/features/interventions/types";

jest.mock("@/features/backoffice/assignInterventionServerAuth", () => ({
  isServerDevUiPreview: () => true,
}));

jest.mock("@/features/interventions/defaultAssignedTechnicianUid", () => ({
  getDefaultAssignedTechnicianUid: () => "demo-tech-local",
}));

function iv(
  partial: Partial<Pick<Intervention, "status" | "assignedTechnicianUid" | "technicianAcceptedAt">> = {},
): Pick<Intervention, "status" | "assignedTechnicianUid" | "technicianAcceptedAt"> {
  return {
    status: "assigned",
    assignedTechnicianUid: "demo-tech-local",
    ...partial,
  };
}

describe("assertTechnicianMayRespondToAssignment", () => {
  it("allows demo assignee with any auth uid in dev preview", () => {
    expect(assertTechnicianMayRespondToAssignment(iv(), "anonymous-uid-xyz")).toBe(true);
  });

  it("rejects when status is not awaiting response", () => {
    expect(assertTechnicianMayRespondToAssignment(iv({ status: "en_route" }), "demo-tech-local")).toBe(
      false,
    );
  });

  it("allows legacy in_progress without technicianAcceptedAt", () => {
    expect(
      assertTechnicianMayRespondToAssignment(
        iv({ status: "in_progress", technicianAcceptedAt: undefined }),
        "demo-tech-local",
      ),
    ).toBe(true);
  });

  it("allows en_route updates for demo assignee", () => {
    expect(
      assertTechnicianMayUpdateAssignedIntervention(
        iv({ status: "en_route", assignedTechnicianUid: "demo-tech-local" }),
        "anonymous-uid",
      ),
    ).toBe(true);
  });
});
