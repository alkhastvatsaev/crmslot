import {
  acceptTechnicianAssignment,
  declineTechnicianAssignment,
} from "@/features/interventions/respondToTechnicianAssignment";
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

const TECH_UID = "tech-uid-1";

const row: Intervention = {
  id: "iv-1",
  title: "Test",
  address: "Rue 1",
  time: "10:00",
  status: "assigned",
  assignedTechnicianUid: TECH_UID,
  location: { lat: 0, lng: 0 },
};

const mockStatusEvent = {
  id: "evt-1",
  interventionId: "iv-1",
  fromStatus: "assigned" as const,
  toStatus: "en_route" as const,
  actorUid: TECH_UID,
  actorRole: "technician" as const,
  at: "2026-06-16T12:00:00.000Z",
};

describe("respondToTechnicianAssignment", () => {
  beforeEach(() => {
    mockTransition.mockReset();
    mockTransition.mockResolvedValue(mockStatusEvent);
  });

  it("accept calls transitionInterventionStatus to en_route", async () => {
    await acceptTechnicianAssignment(row);
    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        interventionId: "iv-1",
        iv: row,
        toStatus: "en_route",
        actor: { uid: TECH_UID, role: "technician" },
      })
    );
  });

  it("decline calls transitionInterventionStatus to pending", async () => {
    await declineTechnicianAssignment(row, TECH_UID);
    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        interventionId: "iv-1",
        iv: row,
        toStatus: "pending",
        actor: { uid: TECH_UID, role: "technician" },
      })
    );
  });
});
