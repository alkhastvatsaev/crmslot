/** @jest-environment node */

/**
 * Parcours route API agent Matériel — formulations variées, OpenAI mocké.
 * Vérifie que chaque phrase atteint bien runChatbotOpenAI (hub) avec le bon contexte.
 */

import { readSseJsonLines } from "@/features/chatbot/testFixtures/readSseJsonLines";
import { runChatbotOpenAI } from "@/features/chatbot/chatbot-openai";
import { handleMaterialAgentPost } from "@/features/featureHub/materialAgentRouteHandler";
import { MATERIAL_AGENT_CLIENT_NAME_MARKER } from "@/features/featureHub/materialAgentOrderClient";

jest.mock("@/features/chatbot/chatbot-openai", () => ({
  ...jest.requireActual("@/features/chatbot/chatbot-openai"),
  runChatbotOpenAI: jest.fn(),
}));

const mockRunChatbotOpenAI = runChatbotOpenAI as jest.MockedFunction<typeof runChatbotOpenAI>;
const auth = { uid: "uid-route-parcours" };
const companyId = "co-parcours";

async function mockOpenAiDone(phrase: string) {
  mockRunChatbotOpenAI.mockImplementationOnce(async (params) => {
    params.emit({ type: "text", delta: `OK:${phrase}` });
    return {
      status: "done" as const,
      apiMessages: [
        ...(params.messages as import("@/features/chatbot/chatbot-stored-messages").ChatbotStoredMessage[]),
        { role: "assistant" as const, content: `OK:${phrase}` },
      ],
    };
  });
}

const STOCK_PHRASES = [
  "ruptures",
  "y'a quoi en rupture",
  "état du stock stp",
  "situation inventaire",
  "alertes stock",
  "stock bas",
  "consultation stock poste-42",
  "demandes technicien en attente",
  "valider les pending",
  "vue d'ensemble stock",
];

const LECOT_PHRASES = [
  "commande lecot",
  "COMMANDE LECOT",
  "je veux commander chez lecot",
  "catalogue fournisseur",
  "suggère des produits lecot",
  "nouvelle commande lecot",
  "fais une commande lecot",
  "besoin d'une commande fournisseur",
  "propose 5 serrures pour lecot",
];

const CLIENT_NAME_PHRASES = ["Dupont", "client Martin SPRL", "nom : Vatsaev", "c'est pour Durand"];

describe("materialAgentRouteParcours — OpenAI mocké", () => {
  const envOpenAI = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "sk-test";
  });

  afterEach(() => {
    if (envOpenAI === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = envOpenAI;
  });

  describe.each(STOCK_PHRASES.map((p) => [p] as const))("demande stock [%s]", (phrase) => {
    it("délègue à runChatbotOpenAI avec hub matériel", async () => {
      await mockOpenAiDone(phrase);
      const res = await handleMaterialAgentPost(
        { companyId, messages: [{ role: "user", content: phrase }] },
        auth
      );
      await readSseJsonLines(res);
      expect(mockRunChatbotOpenAI).toHaveBeenCalledTimes(1);
      const call = mockRunChatbotOpenAI.mock.calls[0]?.[0];
      expect(call?.hubAgentMode).toBe(true);
      expect(call?.toolCtx.lastUserText).toBe(phrase);
      expect(call?.toolCtx.companyId).toBe(companyId);
    });
  });

  describe.each(LECOT_PHRASES.map((p) => [p] as const))("demande Lecot [%s]", (phrase) => {
    it("délègue la demande Lecot à OpenAI", async () => {
      await mockOpenAiDone(phrase);
      const res = await handleMaterialAgentPost(
        {
          companyId,
          companyName: "Société Parcours",
          messages: [{ role: "user", content: phrase }],
        },
        auth
      );
      const events = await readSseJsonLines(res);
      expect(mockRunChatbotOpenAI).toHaveBeenCalledTimes(1);
      expect(events.some((e) => (e as { type?: string }).type === "done")).toBe(true);
      const call = mockRunChatbotOpenAI.mock.calls[0]?.[0];
      expect(call?.toolCtx.materialOrderClientName).toBe("Société Parcours");
      expect(call?.toolCtx.requireMaterialOrderClientName).toBe(false);
    });
  });

  describe.each(CLIENT_NAME_PHRASES.map((p) => [p] as const))(
    "réponse nom client [%s]",
    (phrase) => {
      it("délègue la réponse nom client à OpenAI", async () => {
        await mockOpenAiDone(phrase);
        const res = await handleMaterialAgentPost(
          {
            companyId,
            messages: [
              { role: "user", content: "Commander CYL-1 — Cylindre" },
              {
                role: "assistant",
                content: `Nom client ?\n${MATERIAL_AGENT_CLIENT_NAME_MARKER}`,
              },
              { role: "user", content: phrase },
            ],
          },
          auth
        );
        const events = await readSseJsonLines(res);
        expect(mockRunChatbotOpenAI).toHaveBeenCalledTimes(1);
        expect(events.some((e) => (e as { type?: string }).type === "done")).toBe(true);
      });
    }
  );
});
