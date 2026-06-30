/**
 * @jest-environment node
 */
import {
  ChatbotPostErrorResponseSchema,
  ChatbotPostRequestSchema,
} from "@/core/api/schemas/chatbot";

describe("contract POST /api/ai/chatbot", () => {
  it("accepte un message utilisateur minimal", () => {
    const parsed = ChatbotPostRequestSchema.safeParse({
      companyId: "co-1",
      companyName: "Test Co",
      role: "admin",
      messages: [{ role: "user", content: "Bonjour" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepte confirmTool sans messages (écriture confirmée)", () => {
    const parsed = ChatbotPostRequestSchema.safeParse({
      companyId: "co-1",
      confirmTool: {
        toolUseId: "tool-1",
        name: "focus_intervention_document",
        input: { interventionId: "iv-1", documentType: "invoice" },
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("accepte workspaceSnapshot + toolScope explicite", () => {
    const parsed = ChatbotPostRequestSchema.safeParse({
      companyId: "co-1",
      messages: [{ role: "user", content: "résumé" }],
      workspaceSnapshot: { interventions: [], clients: [] },
      toolScope: ["search_workspace"],
      conversationId: "conv-local-1",
      focusInterventionId: "iv-42",
    });
    expect(parsed.success).toBe(true);
  });

  it("refuse un role inconnu", () => {
    const parsed = ChatbotPostRequestSchema.safeParse({
      companyId: "co-1",
      role: "owner",
      messages: [{ role: "user", content: "hi" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("refuse companyId vide", () => {
    const parsed = ChatbotPostRequestSchema.safeParse({
      companyId: "",
      messages: [{ role: "user", content: "hi" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("refuse toolScope avec entrées vides", () => {
    const parsed = ChatbotPostRequestSchema.safeParse({
      companyId: "co-1",
      toolScope: [""],
      messages: [{ role: "user", content: "hi" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("réponse 400 payload invalide est conforme", () => {
    const parsed = ChatbotPostErrorResponseSchema.safeParse({
      error: "Payload invalide",
      issues: [{ path: ["role"], message: "Invalid enum value" }],
    });
    expect(parsed.success).toBe(true);
  });
});
