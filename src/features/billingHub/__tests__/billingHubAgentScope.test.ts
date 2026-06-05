import { isBillingHubAgentInScope } from "@/features/billingHub/billingHubAgentScope";

describe("isBillingHubAgentInScope", () => {
  it("accepts billing questions", () => {
    expect(isBillingHubAgentInScope("Lister les impayés")).toBe(true);
  });

  it("accepts create-invoice requests with client name", () => {
    expect(isBillingHubAgentInScope("Fait une facture pour M. Dupont")).toBe(true);
  });

  it("rejects stock questions", () => {
    expect(isBillingHubAgentInScope("Quelles ruptures de stock ?")).toBe(false);
  });
});
