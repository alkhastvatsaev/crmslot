import {
  applyBillingLinePatch,
  billingLinesTotalCents,
  parseUnitPriceCents,
} from "@/features/chatbot/chatbot-billing";

describe("chatbot-billing", () => {
  it("parseUnitPriceEur converts to cents", () => {
    expect(parseUnitPriceCents({ unitPriceEur: 500 })).toBe(50_000);
    expect(parseUnitPriceCents({ unitPriceCents: 125 })).toBe(125);
  });

  it("applyBillingLinePatch updates first line or creates default", () => {
    const lines = applyBillingLinePatch([], { unitPriceCents: 50_000 });
    expect(lines[0]).toEqual({
      description: "Prestation",
      quantity: 1,
      unitPriceCents: 50_000,
    });
    expect(billingLinesTotalCents(lines)).toBe(50_000);
  });

  it("applyBillingLinePatch patches description on existing line", () => {
    const lines = applyBillingLinePatch(
      [{ description: "Main d'œuvre", quantity: 2, unitPriceCents: 4500 }],
      { description: "Dépannage", unitPriceCents: 50_000 },
    );
    expect(lines[0].description).toBe("Dépannage");
    expect(lines[0].unitPriceCents).toBe(50_000);
  });
});
