import {
  compactChatbotToolResult,
  stringifyChatbotToolResult,
} from "@/features/chatbot/compactChatbotToolResult";

describe("compactChatbotToolResult", () => {
  it("strips heavy fields from intervention detail", () => {
    const compact = compactChatbotToolResult("get_intervention_detail", {
      id: "iv1",
      status: "done",
      clientName: "Jean Dupont",
      audioTranscript: "x".repeat(5000),
      billingLines: [{ description: "A", quantity: 1, unitPriceCents: 100 }],
    }) as Record<string, unknown>;
    expect(compact.clientName).toBe("Jean Dupont");
    expect(compact).not.toHaveProperty("audioTranscript");
    expect(compact.billingLineCount).toBe(1);
  });

  it("stringify stays under size budget for patch result", () => {
    const s = stringifyChatbotToolResult("patch_intervention_billing", {
      ok: true,
      interventionId: "abc",
      clientName: "Client",
      totalEur: 500,
      previewDocumentType: "invoice",
    });
    expect(s.length).toBeLessThan(500);
  });
});
