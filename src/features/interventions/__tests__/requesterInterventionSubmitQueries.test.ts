import { shouldUseTenantDuplicateScope } from "@/features/interventions/requesterInterventionSubmitQueries";

describe("shouldUseTenantDuplicateScope", () => {
  it("never uses tenant scope for particulier (anonymous-safe)", () => {
    expect(shouldUseTenantDuplicateScope("particulier", "co-default")).toBe(false);
    expect(shouldUseTenantDuplicateScope("particulier", null)).toBe(false);
  });

  it("uses tenant scope for login/register when tenant company is set", () => {
    expect(shouldUseTenantDuplicateScope("login", "co-default")).toBe(true);
    expect(shouldUseTenantDuplicateScope("register", "co-default")).toBe(true);
    expect(shouldUseTenantDuplicateScope("login", null)).toBe(false);
  });
});
