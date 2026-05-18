import { CHATBOT_TOOL_DEFINITIONS, isChatbotWriteTool } from "@/features/chatbot/chatbot-tools";

describe("chatbot-tools", () => {
  it("defines read and write tools", () => {
    expect(CHATBOT_TOOL_DEFINITIONS.length).toBeGreaterThanOrEqual(16);
    expect(CHATBOT_TOOL_DEFINITIONS.some((t) => t.name === "search_workspace")).toBe(true);
    expect(CHATBOT_TOOL_DEFINITIONS.some((t) => t.name === "list_inbox_notifications")).toBe(true);
    expect(CHATBOT_TOOL_DEFINITIONS.some((t) => t.name === "send_intervention_email")).toBe(true);
    expect(isChatbotWriteTool("update_intervention_status")).toBe(true);
    expect(isChatbotWriteTool("send_intervention_email")).toBe(true);
    expect(isChatbotWriteTool("list_interventions")).toBe(false);
  });
});
