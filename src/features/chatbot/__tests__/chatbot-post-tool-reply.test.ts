import { buildChatbotPostToolReply } from "@/features/chatbot/chatbot-post-tool-reply";

describe("buildChatbotPostToolReply", () => {
  it("returns confirmation for send_intervention_email", () => {
    const text = buildChatbotPostToolReply("send_intervention_email", {
      ok: true,
      to: "dupont@example.com",
      subject: "Facture intervention",
      attachmentFilename: "facture.pdf",
    });
    expect(text).toMatch(/Email envoyé/i);
    expect(text).toContain("dupont@example.com");
    expect(text).toContain("Facture intervention");
  });

  it("returns error message when tool failed", () => {
    const text = buildChatbotPostToolReply("send_intervention_email", {
      error: "SMTP non configuré",
    });
    expect(text).toBe("SMTP non configuré");
  });

  it("returns confirmation for send_gmail_reply", () => {
    const text = buildChatbotPostToolReply("send_gmail_reply", {
      ok: true,
      sentTo: "client@example.com",
      subject: "Re: Chantier",
    });
    expect(text).toMatch(/Réponse Gmail envoyée/i);
    expect(text).toContain("client@example.com");
  });

  it("returns confirmation for link_gmail_to_intervention", () => {
    const text = buildChatbotPostToolReply("link_gmail_to_intervention", {
      ok: true,
      interventionId: "iv-42",
      subject: "Colis reçu",
      from: "client@example.com",
    });
    expect(text).toMatch(/Mail lié/i);
    expect(text).toContain("iv-42");
  });
});
