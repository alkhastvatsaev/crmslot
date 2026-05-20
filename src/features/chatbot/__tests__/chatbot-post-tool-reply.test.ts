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
});
