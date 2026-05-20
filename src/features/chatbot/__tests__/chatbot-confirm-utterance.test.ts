import { isChatbotConfirmationUtterance } from "@/features/chatbot/chatbot-confirm-utterance";

describe("isChatbotConfirmationUtterance", () => {
  it("accepts short confirmations", () => {
    expect(isChatbotConfirmationUtterance("oui")).toBe(true);
    expect(isChatbotConfirmationUtterance("Oui.")).toBe(true);
    expect(isChatbotConfirmationUtterance("valide")).toBe(true);
    expect(isChatbotConfirmationUtterance("c'est bon")).toBe(true);
  });

  it("rejects long or unrelated text", () => {
    expect(isChatbotConfirmationUtterance("oui je confirme la commande Litto")).toBe(false);
    expect(isChatbotConfirmationUtterance("non")).toBe(false);
    expect(isChatbotConfirmationUtterance("")).toBe(false);
  });
});
