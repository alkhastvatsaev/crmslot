import { resolveTechnicianAssignmentsPollMs } from "@/features/interventions/technicianAssignmentsQuery";

describe("resolveTechnicianAssignmentsPollMs", () => {
  it("ralentit le polling sur téléphone", () => {
    expect(
      resolveTechnicianAssignmentsPollMs("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")
    ).toBe(180_000);
  });

  it("garde 12s sur desktop", () => {
    expect(resolveTechnicianAssignmentsPollMs("Mozilla/5.0 (Macintosh)")).toBe(12_000);
  });
});
