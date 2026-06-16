"use client";

import { assignInterventionFromBackoffice } from "@/features/backoffice/assignInterventionFromBackoffice";
import { applyBackofficeTechnicianAssignmentClient } from "@/features/backoffice/applyBackofficeTechnicianAssignmentClient";
import { makeIntervention } from "@/test-utils/factories";

jest.mock("@/core/config/firebase", () => ({
  auth: { currentUser: { uid: "actor-uid" } },
  firestore: {},
}));

jest.mock("@/features/backoffice/applyBackofficeTechnicianAssignmentClient", () => ({
  applyBackofficeTechnicianAssignmentClient: jest.fn(async () => undefined),
}));

const mockApply = applyBackofficeTechnicianAssignmentClient as jest.MockedFunction<
  typeof applyBackofficeTechnicianAssignmentClient
>;

describe("assignInterventionFromBackoffice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses client Firestore path", async () => {
    const row = makeIntervention({ id: "iv-1" });
    await assignInterventionFromBackoffice("iv-1", row, "tech-uid", {
      scheduledDate: "2026-06-16",
      scheduledTime: "14:00",
    });
    expect(mockApply).toHaveBeenCalledWith(
      "iv-1",
      row,
      "tech-uid",
      "actor-uid",
      expect.objectContaining({ scheduledDate: "2026-06-16" })
    );
  });
});
