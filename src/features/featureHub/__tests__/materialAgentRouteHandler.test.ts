/** @jest-environment node */

import { readSseJsonLines } from "@/features/chatbot/testFixtures/readSseJsonLines";
import { runChatbotOpenAI } from "@/features/chatbot/chatbot-openai";
import {
  MATERIAL_AGENT_TOOL_SCOPE,
  handleMaterialAgentPost,
} from "@/features/featureHub/materialAgentRouteHandler";
jest.mock("@/features/chatbot/chatbot-openai", () => ({
  ...jest.requireActual("@/features/chatbot/chatbot-openai"),
  runChatbotOpenAI: jest.fn(),
}));

const mockRunChatbotOpenAI = runChatbotOpenAI as jest.MockedFunction<typeof runChatbotOpenAI>;
const auth = { uid: "uid-mat" };

describe("materialAgentRouteHandler", () => {
  const envOpenAI = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "sk-test";
    mockRunChatbotOpenAI.mockResolvedValue({
      status: "done",
      apiMessages: [{ role: "assistant", content: "2 ruptures." }],
    });
  });

  afterEach(() => {
    if (envOpenAI === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = envOpenAI;
  });

  it("exports a stock-only tool scope", () => {
    expect(MATERIAL_AGENT_TOOL_SCOPE).toEqual([
      "get_workspace_summary",
      "list_stock_alerts",
      "list_material_orders",
      "search_lecot_products",
      "order_lecot_parts",
    ]);
  });

  it("returns 400 when companyId is missing", async () => {
    const res = await handleMaterialAgentPost(
      { messages: [{ role: "user", content: "ruptures" }] },
      auth,
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "companyId requis" });
  });

  it("returns 400 when messages are empty", async () => {
    const res = await handleMaterialAgentPost({ companyId: "co-mat", messages: [] }, auth);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "messages requis" });
  });

  it("delegates to runChatbotOpenAI with material scope and dedicated system prompt", async () => {
    const res = await handleMaterialAgentPost(
      {
        companyId: "co-mat",
        companyName: "Atelier Test",
        role: "admin",
        messages: [{ role: "user", content: "état du stock" }],
        stockSnapshot: '{"totalSkus":3}',
      },
      auth,
    );

    const events = await readSseJsonLines(res);
    expect(events.some((e) => (e as { type?: string }).type === "done")).toBe(true);

    expect(mockRunChatbotOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        toolScope: [...MATERIAL_AGENT_TOOL_SCOPE],
        toolCtx: expect.objectContaining({ companyId: "co-mat", actorUid: "uid-mat" }),
      }),
    );
    const call = mockRunChatbotOpenAI.mock.calls[0]?.[0];
    expect(call?.system).toContain("Agent Matériel");
    expect(call?.system).toContain("Atelier Test (co-mat)");
    expect(call?.system).toContain('"totalSkus":3');
  });

  it("streams error when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await handleMaterialAgentPost(
      { companyId: "co-mat", messages: [{ role: "user", content: "hi" }] },
      auth,
    );
    const events = await readSseJsonLines(res);
    expect(events).toContainEqual(
      expect.objectContaining({ type: "error", message: "OPENAI_API_KEY manquante." }),
    );
    expect(mockRunChatbotOpenAI).not.toHaveBeenCalled();
  });
});
