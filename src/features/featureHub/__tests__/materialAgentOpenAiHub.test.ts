/** @jest-environment node */

/**
 * Intégration runChatbotOpenAI réel (stream OpenAI mocké, outils mockés)
 * — parcours hub Matériel : outils puis synthèse texte.
 */

import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { readSseJsonLines } from "@/features/chatbot/testFixtures/readSseJsonLines";
import { executeChatbotTool } from "@/features/chatbot/chatbot-tool-executor";
import { handleMaterialAgentPost } from "@/features/featureHub/materialAgentRouteHandler";
jest.mock("@/features/chatbot/chatbot-tool-executor", () => ({
  ...jest.requireActual("@/features/chatbot/chatbot-tool-executor"),
  executeChatbotTool: jest.fn(),
}));

type StreamRound = {
  text?: string;
  tools?: Array<{ name: string; arguments: Record<string, unknown> }>;
};

function buildChunks(round: StreamRound): ChatCompletionChunk[] {
  const chunks: ChatCompletionChunk[] = [];
  if (round.tools?.length) {
    for (const [index, tool] of round.tools.entries()) {
      chunks.push({
        id: `chunk-tool-${index}`,
        object: "chat.completion.chunk",
        created: Date.now(),
        model: "gpt-4o-mini",
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [
                {
                  index,
                  id: `call_${tool.name}_${index}`,
                  type: "function",
                  function: {
                    name: tool.name,
                    arguments: JSON.stringify(tool.arguments),
                  },
                },
              ],
            },
            finish_reason: null,
          },
        ],
      } as ChatCompletionChunk);
    }
  }
  if (round.text) {
    chunks.push({
      id: "chunk-text",
      object: "chat.completion.chunk",
      created: Date.now(),
      model: "gpt-4o-mini",
      choices: [{ index: 0, delta: { content: round.text }, finish_reason: null }],
    } as ChatCompletionChunk);
  }
  chunks.push({
    id: "chunk-stop",
    object: "chat.completion.chunk",
    created: Date.now(),
    model: "gpt-4o-mini",
    choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
  } as ChatCompletionChunk);
  return chunks;
}

// openai mock hoisted
const openAiRounds: StreamRound[] = [];
let openAiCall = 0;

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(async () => {
          const round = openAiRounds[openAiCall] ?? { text: "Fin." };
          openAiCall += 1;
          const chunks = buildChunks(round);
          return {
            [Symbol.asyncIterator]: async function* () {
              for (const chunk of chunks) yield chunk;
            },
          };
        }),
      },
    },
  }));
});

const mockExecuteChatbotTool = executeChatbotTool as jest.MockedFunction<typeof executeChatbotTool>;
const auth = { uid: "uid-openai-hub" };

describe("materialAgentOpenAiHub — runChatbotOpenAI + stream mocké", () => {
  const envOpenAI = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    openAiCall = 0;
    openAiRounds.length = 0;
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "sk-test";
    mockExecuteChatbotTool.mockImplementation(async (name, args) => {
      if (name === "list_stock_alerts") {
        return [{ name: "Cylindre Yale", sku: "CYL-1", quantity: 0 }];
      }
      if (name === "search_lecot_products") {
        return {
          suggestions: [
            {
              sku: "LEC-1",
              label: "Serrure test",
              unitPriceEur: 12,
              unitPriceCents: 1200,
            },
          ],
        };
      }
      if (name === "order_lecot_parts") {
        return {
          ok: true,
          supplierOrderId: "ord-hub-1",
          clientName: String((args as Record<string, unknown>).clientName ?? ""),
          totalCents: 1200,
          lines: [{ sku: "LEC-1", label: "Serrure test", quantity: 1 }],
        };
      }
      return { ok: true };
    });
  });

  afterEach(() => {
    if (envOpenAI === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = envOpenAI;
  });

  it("ruptures → outil list_stock_alerts puis réponse texte", async () => {
    openAiRounds.push(
      { tools: [{ name: "list_stock_alerts", arguments: {} }] },
      { text: "Il y a 1 article en rupture." }
    );
    const res = await handleMaterialAgentPost(
      {
        companyId: "co-hub",
        messages: [{ role: "user", content: "ruptures de stock" }],
      },
      auth
    );
    const events = await readSseJsonLines(res);
    expect(mockExecuteChatbotTool).toHaveBeenCalledWith(
      "list_stock_alerts",
      expect.any(Object),
      expect.objectContaining({ companyId: "co-hub" })
    );
    const text = events
      .filter((e) => (e as { type?: string }).type === "text")
      .map((e) => (e as { delta?: string }).delta ?? "")
      .join("");
    expect(text).toMatch(/rupture/i);
    expect(events.some((e) => (e as { type?: string }).type === "done")).toBe(true);
  });

  it("commande lecot → passe par OpenAI (plus de raccourci catalogue)", async () => {
    openAiRounds.push(
      { tools: [{ name: "search_lecot_products", arguments: { query: "poignée", limit: 5 } }] },
      { text: "Voici des poignées du catalogue Lecot." }
    );
    const res = await handleMaterialAgentPost(
      {
        companyId: "co-hub",
        messages: [{ role: "user", content: "commander une poignée lecot" }],
      },
      auth
    );
    const events = await readSseJsonLines(res);
    expect(mockExecuteChatbotTool).toHaveBeenCalledWith(
      "search_lecot_products",
      expect.objectContaining({ query: expect.stringMatching(/poign/i) }),
      expect.anything()
    );
    expect(events.some((e) => (e as { type?: string }).type === "done")).toBe(true);
  });

  it("order_lecot sans client explicite → commande avec nom société", async () => {
    openAiRounds.push({
      tools: [
        {
          name: "order_lecot_parts",
          arguments: {
            lines: [{ sku: "LEC-1", label: "Serrure", quantity: 1, unitPriceEur: 12 }],
          },
        },
      ],
    });
    const res = await handleMaterialAgentPost(
      {
        companyId: "co-hub",
        companyName: "Atelier Hub",
        messages: [
          { role: "user", content: "commande lecot" },
          { role: "assistant", content: "**Catalogue**\n1. Serrure (SKU LEC-1)" },
          { role: "user", content: "Commander LEC-1 — Serrure" },
        ],
      },
      auth
    );
    const events = await readSseJsonLines(res);
    const text = events
      .filter((e) => (e as { type?: string }).type === "text")
      .map((e) => (e as { delta?: string }).delta ?? "")
      .join("");
    expect(text).not.toMatch(/nom du client/i);
    expect(mockExecuteChatbotTool).toHaveBeenCalledWith(
      "order_lecot_parts",
      expect.objectContaining({ clientName: "Atelier Hub" }),
      expect.objectContaining({ materialOrderClientName: "Atelier Hub" })
    );
  });
});
