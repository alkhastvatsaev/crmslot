import { extractChatbotTrainingTurn } from "@/features/chatbot/training/extractChatbotTrainingTurn";

describe("extractChatbotTrainingTurn", () => {
  it("extracts last user and last assistant text", () => {
    const turn = extractChatbotTrainingTurn([
      { role: "user", content: "ancienne question" },
      { role: "assistant", content: "ancienne réponse" },
      { role: "user", content: "Combien d’interventions ?" },
      { role: "assistant", content: "Vous en avez 12 ouverts." },
    ]);
    expect(turn).toEqual({
      userMessage: "Combien d’interventions ?",
      assistantMessage: "Vous en avez 12 ouverts.",
      hadToolRounds: false,
    });
  });

  it("detects tool rounds between user and assistant", () => {
    const turn = extractChatbotTrainingTurn([
      { role: "user", content: "Stock Dupont" },
      {
        role: "assistant",
        content: null,
        tool_calls: [{ id: "c1", name: "list_stock_alerts", arguments: {} }],
      },
      { role: "tool", tool_call_id: "c1", content: '{"ok":true}' },
      { role: "assistant", content: "2 alertes stock." },
    ]);
    expect(turn?.hadToolRounds).toBe(true);
    expect(turn?.assistantMessage).toBe("2 alertes stock.");
  });

  it("returns null if no assistant text", () => {
    expect(
      extractChatbotTrainingTurn([{ role: "user", content: "hello" }]),
    ).toBeNull();
  });
});
