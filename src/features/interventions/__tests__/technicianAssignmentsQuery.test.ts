import { IOS_FIRESTORE_POLL_MS } from "@/core/firestore/iosFirestorePolling";
import { resolveTechnicianAssignmentsPollMs } from "@/features/interventions/technicianAssignmentsQuery";

describe("resolveTechnicianAssignmentsPollMs", () => {
  it("aligne le polling iPhone sur le fetch Firestore (pas de snapshot)", () => {
    expect(
      resolveTechnicianAssignmentsPollMs("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")
    ).toBe(IOS_FIRESTORE_POLL_MS);
  });

  it("garde 12s sur desktop", () => {
    expect(resolveTechnicianAssignmentsPollMs("Mozilla/5.0 (Macintosh)")).toBe(12_000);
  });
});
