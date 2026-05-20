import {
  filterChatbotToolDefinitions,
  inferChatbotToolScope,
} from "@/features/chatbot/chatbot-tool-routing";
import { CHATBOT_TOOL_DEFINITIONS } from "@/features/chatbot/chatbot-tools";

describe("chatbot-tool-routing", () => {
  it("scopes billing tools only for facture messages", () => {
    const scope = inferChatbotToolScope("Modifier le prix de la facture Dupont");
    expect(scope).toBeDefined();
    expect(scope).toContain("patch_intervention_billing");
    expect(scope).not.toContain("order_lecot_parts");
  });

  it("scopes email only for envoie un mail (no lecot leak)", () => {
    const scope = inferChatbotToolScope("envoie un mail a monsieur dupont");
    expect(scope).toContain("send_intervention_email");
    expect(scope).not.toContain("order_lecot_parts");
    expect(scope).not.toContain("search_lecot_products");
  });

  it("scopes lecot for catalogue messages", () => {
    const scope = inferChatbotToolScope("Commande Lecot perceuse");
    expect(scope).toContain("search_lecot_products");
    expect(scope).toContain("order_lecot_parts");
  });

  it("returns empty scope for short greetings (no tools)", () => {
    expect(inferChatbotToolScope("Bonjour")).toEqual([]);
  });

  it("returns core scope for generic chat without domain hints", () => {
    const scope = inferChatbotToolScope("Où en est le dossier Dupont ?");
    expect(scope).toContain("list_interventions");
    expect(scope).not.toContain("order_lecot_parts");
  });

  it("filterChatbotToolDefinitions reduces count", () => {
    const scope = inferChatbotToolScope("facture 500€");
    const filtered = filterChatbotToolDefinitions(CHATBOT_TOOL_DEFINITIONS, scope);
    expect(filtered.length).toBeLessThan(CHATBOT_TOOL_DEFINITIONS.length);
    expect(filtered.length).toBeGreaterThan(0);
  });
});
