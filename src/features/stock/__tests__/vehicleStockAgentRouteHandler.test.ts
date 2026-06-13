/** @jest-environment node */

import { readSseJsonLines } from "@/features/chatbot/testFixtures/readSseJsonLines";
import { runChatbotOpenAI } from "@/features/chatbot/chatbot-openai";
import { handleVehicleStockAgentPost } from "@/features/stock/vehicleStockAgentRouteHandler";
import { VEHICLE_STOCK_AGENT_TOOL_SCOPE } from "@/features/hubAgents/hubAgentToolScopes";

jest.mock("@/features/chatbot/chatbot-openai", () => ({
  ...jest.requireActual("@/features/chatbot/chatbot-openai"),
  runChatbotOpenAI: jest.fn(),
}));

const mockRunChatbotOpenAI = runChatbotOpenAI as jest.MockedFunction<typeof runChatbotOpenAI>;
const auth = { uid: "tech-stock-1" };

describe("vehicleStockAgentRouteHandler", () => {
  const envOpenAI = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "sk-test";
    mockRunChatbotOpenAI.mockResolvedValue({
      status: "done",
      apiMessages: [{ role: "assistant", content: "2 articles en stock." }],
    });
  });

  afterEach(() => {
    if (envOpenAI === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = envOpenAI;
  });

  it("expose le scope outils stock véhicule", () => {
    expect(VEHICLE_STOCK_AGENT_TOOL_SCOPE).toEqual([
      "list_vehicle_stock",
      "add_vehicle_stock_item",
      "update_vehicle_stock_item",
    ]);
  });

  it("retourne 400 si companyId manquant", async () => {
    const res = await handleVehicleStockAgentPost(
      { messages: [{ role: "user", content: "stock" }] },
      auth
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "companyId requis" });
  });

  it("retourne 400 si messages vides", async () => {
    const res = await handleVehicleStockAgentPost({ companyId: "co-1", messages: [] }, auth);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "messages requis" });
  });

  it("délègue à runChatbotOpenAI avec le scope stock véhicule", async () => {
    const res = await handleVehicleStockAgentPost(
      {
        companyId: "co-1",
        companyName: "Atelier",
        messages: [{ role: "user", content: "ruptures camion" }],
      },
      auth
    );

    const events = await readSseJsonLines(res);
    expect(events.some((e) => (e as { type?: string }).type === "done")).toBe(true);

    expect(mockRunChatbotOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        toolScope: [...VEHICLE_STOCK_AGENT_TOOL_SCOPE],
        hubAgentMode: true,
        toolCtx: expect.objectContaining({
          companyId: "co-1",
          actorUid: "tech-stock-1",
        }),
      })
    );
  });

  it("émet une erreur SSE si OPENAI_API_KEY absente", async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await handleVehicleStockAgentPost(
      {
        companyId: "co-1",
        messages: [{ role: "user", content: "stock" }],
      },
      auth
    );
    const events = await readSseJsonLines(res);
    expect(events.some((e) => (e as { type?: string }).type === "error")).toBe(true);
    expect(mockRunChatbotOpenAI).not.toHaveBeenCalled();
  });
});
