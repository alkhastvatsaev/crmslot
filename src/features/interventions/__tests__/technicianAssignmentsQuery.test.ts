import { resolveTechnicianAssignmentsPollMs } from "@/features/interventions/technicianAssignmentsQuery";

describe("resolveTechnicianAssignmentsPollMs", () => {
  it("12s sur tous les appareils (mode capacité max)", () => {
    expect(
      resolveTechnicianAssignmentsPollMs("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")
    ).toBe(12_000);
    expect(resolveTechnicianAssignmentsPollMs("Mozilla/5.0 (Macintosh)")).toBe(12_000);
  });
});
