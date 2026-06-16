import { transitionInterventionFromTechnician } from "@/features/interventions/workflow/transitionInterventionFromTechnician";
import type { Intervention } from "@/features/interventions/types";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";

jest.mock("@/core/config/firebase", () => ({
  firestore: {},
  auth: { currentUser: { uid: "tech-uid-1" } },
}));

jest.mock("@/features/interventions/workflow/transitionInterventionStatus", () => ({
  transitionInterventionStatus: jest.fn(),
}));

const mockTransition = transitionInterventionStatus as jest.MockedFunction<
  typeof transitionInterventionStatus
>;

const iv: Pick<Intervention, "status" | "assignedTechnicianUid" | "createdByUid" | "companyId"> = {
  status: "en_route",
  assignedTechnicianUid: "tech-uid-1",
  createdByUid: "creator-1",
  companyId: "co-test",
};

const mockStatusEvent = {
  id: "evt-1",
  interventionId: "iv-42",
  fromStatus: "en_route" as const,
  toStatus: "in_progress" as const,
  actorUid: "tech-uid-1",
  actorRole: "technician" as const,
  at: "2026-06-16T12:00:00.000Z",
};

describe("transitionInterventionFromTechnician", () => {
  beforeEach(() => {
    mockTransition.mockReset();
    mockTransition.mockResolvedValue(mockStatusEvent);
  });

  it("calls transitionInterventionStatus with authenticated technician actor", async () => {
    await transitionInterventionFromTechnician({
      interventionId: "iv-42",
      iv,
      toStatus: "in_progress",
    });
    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        interventionId: "iv-42",
        iv,
        toStatus: "in_progress",
        actor: { uid: "tech-uid-1", role: "technician" },
        note: undefined,
        extraPatch: undefined,
      })
    );
  });
});
