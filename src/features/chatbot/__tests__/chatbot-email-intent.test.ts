import {
  isChatbotEmailIntent,
  isChatbotLecotOrderIntent,
  shouldAutoConfirmChatbotEmailWrite,
  shouldPreferChatbotEmailOverLecot,
} from "@/features/chatbot/chatbot-email-intent";
import { resolveLecotCatalogSearchQuery } from "@/features/chatbot/chatbot-lecot-follow-up";
import { resolveChatbotConversationContext } from "@/features/chatbot/chatbot-conversation-context";

describe("chatbot-email-intent", () => {
  it("detects send-email phrasing", () => {
    expect(isChatbotEmailIntent("envoie un mail a monsieur dupont")).toBe(true);
    expect(isChatbotEmailIntent("Envoie un email à client@test.be la facture")).toBe(true);
    expect(isChatbotEmailIntent("envoie lui un mail")).toBe(true);
    expect(isChatbotEmailIntent("prévient le client par mail")).toBe(true);
    expect(isChatbotEmailIntent("envoie un mail pour prévenir le client")).toBe(true);
  });

  it("auto-confirms send_intervention_email when user asks to send mail", () => {
    expect(
      shouldAutoConfirmChatbotEmailWrite(
        "send_intervention_email",
        "envoie un mail a monsieur dupont",
      ),
    ).toBe(true);
  });

  it("does not treat lecot order as email", () => {
    expect(isChatbotLecotOrderIntent("commande une serrure sur lecot")).toBe(true);
    expect(shouldPreferChatbotEmailOverLecot("commande une serrure sur lecot")).toBe(false);
  });

  it("resolveLecotCatalogSearchQuery returns null for email-only message", () => {
    expect(
      resolveLecotCatalogSearchQuery("envoie un mail a monsieur dupont", []),
    ).toBeNull();
  });

  it("conversation context skips lecot instant search for email message", () => {
    const ctx = resolveChatbotConversationContext({
      hasWorkspaceSnapshot: true,
      messages: [
        { role: "user", content: "commande lecot" },
        { role: "assistant", content: "Quel produit souhaitez-vous ?" },
        { role: "user", content: "envoie un mail a monsieur dupont" },
      ],
    });
    expect(ctx.activeFlows).toContain("email");
    expect(ctx.activeFlows).not.toContain("lecot");
    expect(ctx.turnDirective).toBe("email");
    expect(ctx.lecotSearchQuery).toBeNull();
    expect(ctx.forceToolName).toBeNull();
    expect(ctx.toolScope).toBeDefined();
    expect(ctx.toolScope).toContain("send_intervention_email");
    expect(ctx.toolScope).not.toContain("order_lecot_parts");
    expect(ctx.toolScope).not.toContain("search_lecot_products");
  });
});
