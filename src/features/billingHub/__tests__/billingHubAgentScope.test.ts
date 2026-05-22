import { isBillingHubAgentInScope } from "@/features/billingHub/billingHubAgentScope";

describe("isBillingHubAgentInScope", () => {
  it("accepts billing questions", () => {
    expect(isBillingHubAgentInScope("Lister les impayés")).toBe(true);
  });

  it("rejects stock questions", () => {
    expect(isBillingHubAgentInScope("Quelles ruptures de stock ?")).toBe(false);
  });
});
