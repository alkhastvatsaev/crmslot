import {
  appendChatbotToolRoundResult,
  repairChatbotToolMessagePairs,
} from "@/features/chatbot/chatbot-message-trim";
import type { ChatbotStoredMessage } from "@/features/chatbot/chatbot-stored-messages";

describe("repairChatbotToolMessagePairs", () => {
  it("drops orphan tool messages", () => {
    const fixed = repairChatbotToolMessagePairs([
      { role: "user", content: "hi" },
      { role: "tool", tool_call_id: "call_1", content: "{}" },
    ]);
    expect(fixed).toEqual([{ role: "user", content: "hi" }]);
  });

  it("keeps complete tool rounds", () => {
    const round: ChatbotStoredMessage[] = [
      { role: "user", content: "commande" },
      {
        role: "assistant",
        content: null,
        tool_calls: [{ id: "call_1", name: "order_lecot_parts", arguments: {} }],
      },
      { role: "tool", tool_call_id: "call_1", content: '{"ok":true}' },
      { role: "assistant", content: "OK" },
    ];
    expect(repairChatbotToolMessagePairs(round)).toEqual(round);
  });
});

describe("appendChatbotToolRoundResult", () => {
  it("inserts tool after pending assistant tool_calls", () => {
    const next = appendChatbotToolRoundResult(
      [
        { role: "user", content: "commande lecot" },
        {
          role: "assistant",
          content: null,
          tool_calls: [{ id: "call_abc", name: "order_lecot_parts", arguments: { lines: [] } }],
        },
      ],
      "call_abc",
      "order_lecot_parts",
      '{"ok":true}',
      "Commande enregistrée",
    );
    expect(next).toHaveLength(4);
    expect(next[1].role).toBe("assistant");
    expect(next[2].role).toBe("tool");
    expect((next[2] as { tool_call_id: string }).tool_call_id).toBe("call_abc");
    expect(next[3]).toEqual({ role: "assistant", content: "Commande enregistrée" });
  });
});
