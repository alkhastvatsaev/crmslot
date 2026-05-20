import {
  isImperativeBillingRequest,
  parseBillingLineDrafts,
  shouldAutoConfirmChatbotBillingWrite,
} from "@/features/chatbot/chatbot-billing-parse";

describe("chatbot-billing-parse", () => {
  it("parse deux lignes avec et", () => {
    const lines = parseBillingLineDrafts(
      "ajoute une serrure a 300€ et main d'oeuvre 50€",
    );
    expect(lines).toHaveLength(2);
    expect(lines[0].description).toMatch(/serrure/i);
    expect(lines[0].unitPriceEur).toBe(300);
    expect(lines[1].description).toMatch(/main/i);
    expect(lines[1].unitPriceEur).toBe(50);
  });

  it("isImperativeBillingRequest", () => {
    expect(isImperativeBillingRequest("ajoute une serrure")).toBe(true);
    expect(isImperativeBillingRequest("bonjour")).toBe(false);
  });

  it("shouldAutoConfirmChatbotBillingWrite", () => {
    expect(
      shouldAutoConfirmChatbotBillingWrite(
        "patch_intervention_billing",
        "ajoute serrure 300€",
      ),
    ).toBe(true);
    expect(
      shouldAutoConfirmChatbotBillingWrite("send_intervention_email", "ajoute serrure"),
    ).toBe(false);
  });
});
