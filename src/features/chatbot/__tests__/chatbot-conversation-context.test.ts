import {
  isShortFollowUpAnswer,
  resolveChatbotConversationContext,
} from "@/features/chatbot/chatbot-conversation-context";

describe("chatbot-conversation-context", () => {
  it("forces lecot search query on long natural message mentioning serrure", () => {
    const long =
      "Pour le client Dupont j'ai besoin d'une nouvelle serrure multipoints type Vachette sur la porte d'entrée, tu peux me proposer des références Lecot ?";
    const ctx = resolveChatbotConversationContext({
      hasWorkspaceSnapshot: true,
      messages: [{ role: "user", content: long }],
    });
    expect(ctx.activeFlows).toContain("lecot");
    expect(ctx.lecotSearchQuery).toBeTruthy();
    expect(ctx.forceToolName).toBe("search_lecot_products");
  });

  it("resolves lecot query for propose 5 serrures", () => {
    const ctx = resolveChatbotConversationContext({
      hasWorkspaceSnapshot: true,
      messages: [{ role: "user", content: "propose 5 serrures" }],
    });
    expect(ctx.lecotSearchQuery).toBe("serrure");
    expect(ctx.forceToolName).toBe("search_lecot_products");
  });

  it("detects lecot flow from assistant question + short product answer", () => {
    const ctx = resolveChatbotConversationContext({
      hasWorkspaceSnapshot: true,
      messages: [
        { role: "user", content: "commande lecot" },
        {
          role: "assistant",
          content:
            "Pour passer une commande Lecot, pourriez-vous me donner des détails sur les produits ?",
        },
        { role: "user", content: "une serrure" },
      ],
    });
    expect(ctx.activeFlows).toContain("lecot");
    expect(ctx.needsTools).toBe(true);
    expect(ctx.toolScope).toContain("search_lecot_products");
    expect(ctx.lecotSearchQuery).toBe("serrure");
  });

  it("keeps billing flow when assistant asked for amount", () => {
    const ctx = resolveChatbotConversationContext({
      hasWorkspaceSnapshot: true,
      messages: [
        { role: "user", content: "facture Dupont" },
        { role: "assistant", content: "Quel montant souhaitez-vous sur la facture ?" },
        { role: "user", content: "500 €" },
      ],
    });
    expect(ctx.activeFlows).toContain("billing");
    expect(ctx.toolScope).toContain("patch_intervention_billing");
    expect(ctx.toolScope).not.toContain("order_lecot_parts");
  });

  it("uses minimal snapshot tools for generic chitchat", () => {
    const ctx = resolveChatbotConversationContext({
      hasWorkspaceSnapshot: true,
      messages: [{ role: "user", content: "merci beaucoup" }],
    });
    expect(ctx.needsTools).toBe(false);
    expect(ctx.toolScope).toEqual([
      "search_workspace",
      "get_intervention_detail",
      "get_client_detail",
    ]);
  });

  it("isShortFollowUpAnswer accepts product names", () => {
    expect(isShortFollowUpAnswer("une serrure")).toBe(true);
    expect(isShortFollowUpAnswer("x".repeat(80))).toBe(false);
  });

  it("transitions from lecot to email flow clearly without mixing scopes", () => {
    const ctx = resolveChatbotConversationContext({
      hasWorkspaceSnapshot: true,
      explicitToolScope: ["search_workspace", "send_intervention_email"],
      messages: [
        { role: "user", content: "commande lecot" },
        { role: "assistant", content: "Quel produit souhaitez-vous ?" },
        { role: "user", content: "une serrure" },
        { role: "assistant", content: "Serrure ajoutée au panier. Commande validée." },
        { role: "user", content: "prévient le client par mail" },
      ],
    });
    // The explicit tool scope should remain email, and the lecot flow should be suppressed for this turn
    expect(ctx.turnDirective).toBe("email");
    expect(ctx.toolScope).toEqual(["search_workspace", "send_intervention_email"]);
    expect(ctx.forceToolName).toBeNull();
  });
});
