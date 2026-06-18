import {
  interventionAssignmentPreview,
  newAssignmentIdsFromSnapshotChanges,
} from "@/features/interventions/technicianNewAssignmentAlerts";
import { makeIntervention } from "@/test-utils/factories";

describe("technicianNewAssignmentAlerts", () => {
  it("newAssignmentIdsFromSnapshotChanges returns only unseen added docs", () => {
    const known = new Set(["iv-1"]);
    const ids = newAssignmentIdsFromSnapshotChanges(
      [
        { type: "added", docId: "iv-1" },
        { type: "added", docId: "iv-2" },
        { type: "modified", docId: "iv-3" },
      ],
      known
    );
    expect(ids).toEqual(["iv-2"]);
  });

  it("interventionAssignmentPreview prefers title then client name", () => {
    const iv = makeIntervention({
      title: "Fuite cuisine",
      clientFirstName: "Alice",
      clientLastName: "Martin",
    });
    expect(interventionAssignmentPreview(iv)).toBe("Fuite cuisine");
    expect(
      interventionAssignmentPreview(makeIntervention({ title: "", clientFirstName: "Bob" }))
    ).toMatch(/Bob/i);
  });
});
