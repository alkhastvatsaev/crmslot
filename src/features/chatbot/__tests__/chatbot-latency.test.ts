import {
  conversationNeedsChatbotTools,
  countChatbotUserTurns,
  messageNeedsChatbotTools,
} from "@/features/chatbot/chatbot-latency";

describe("chatbot-latency", () => {
  it("messageNeedsChatbotTools detects billing and lecot", () => {
    expect(messageNeedsChatbotTools("Mets la facture à 500 €")).toBe(true);
    expect(messageNeedsChatbotTools("Commande Lecot perceuse")).toBe(true);
    expect(messageNeedsChatbotTools("une serrure")).toBe(true);
    expect(messageNeedsChatbotTools("Comment va la journée ?")).toBe(false);
  });

  it("conversationNeedsChatbotTools uses prior user turns (Lecot follow-up)", () => {
    const messages = [
      { role: "user", content: "commande lecot" },
      { role: "assistant", content: "Quel produit ?" },
      { role: "user", content: "une serrure" },
    ];
    expect(conversationNeedsChatbotTools("une serrure", messages)).toBe(true);
    expect(messageNeedsChatbotTools("une serrure")).toBe(true);
  });

  it("countChatbotUserTurns counts user messages", () => {
    expect(
      countChatbotUserTurns([
        { role: "user", content: "a" },
        { role: "assistant", content: "b" },
        { role: "user", content: "c" },
      ]),
    ).toBe(2);
  });
});
