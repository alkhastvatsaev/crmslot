import {
  buildChatbotGreetingReply,
  isChatbotGreetingMessage,
  normalizeChatbotUserText,
} from "@/features/chatbot/chatbot-greeting";

describe("chatbot-greeting", () => {
  it("detects Hey and variants", () => {
    expect(isChatbotGreetingMessage("Hey")).toBe(true);
    expect(isChatbotGreetingMessage("hey!")).toBe(true);
    expect(isChatbotGreetingMessage("Hey 👋")).toBe(true);
    expect(isChatbotGreetingMessage("Hey there")).toBe(false);
  });

  it("strips emoji before match", () => {
    expect(normalizeChatbotUserText("  Hey 👋  ")).toBe("Hey");
  });

  it("builds greeting reply with optional snapshot hint", () => {
    const reply = buildChatbotGreetingReply({
      generatedAt: "2026-01-01",
      locale: "fr",
      company: { id: "co", name: "Test", role: "admin" },
      summary: {
        totalInterventions: 1,
        byStatus: {},
        urgentOpen: 2,
        awaitingAssignment: 1,
        inProgress: 0,
        doneOrInvoiced: 0,
        unpaidCount: 0,
        paidCount: 0,
        pendingOfflineQueue: 0,
        navigatorOnline: true,
      },
      clients: [],
      interventions: [],
    });
    expect(reply).toMatch(/Bonjour/i);
    expect(reply).toMatch(/urgence/i);
  });
});
