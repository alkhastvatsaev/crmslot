/** @jest-environment node */

import {
  handleChatbotPost,
  lastUserMessageText,
  resolveChatbotToolScopeFromBody,
} from "@/features/chatbot/chatbot-route-handler";
import { CHATBOT_TOOL_CORE_NO_SNAPSHOT } from "@/features/chatbot/chatbot-tool-routing";
import { readSseJsonLines } from "@/features/chatbot/testFixtures/readSseJsonLines";
import { executeChatbotTool } from "@/features/chatbot/chatbot-tool-executor";
import { runChatbotOpenAI } from "@/features/chatbot/chatbot-openai";
import { buildChatbotTestSnapshot } from "@/features/chatbot/testFixtures/chatbotWorkspaceSnapshot";

jest.mock("@/features/chatbot/chatbot-tool-executor", () => ({
  executeChatbotTool: jest.fn(),
}));

jest.mock("@/features/chatbot/chatbot-openai", () => ({
  ...jest.requireActual("@/features/chatbot/chatbot-openai"),
  runChatbotOpenAI: jest.fn(),
}));

const mockExecuteChatbotTool = executeChatbotTool as jest.MockedFunction<typeof executeChatbotTool>;
const mockRunChatbotOpenAI = runChatbotOpenAI as jest.MockedFunction<typeof runChatbotOpenAI>;

const auth = { uid: "uid-test" };

describe("chatbot-route-handler", () => {
  const envOpenAI = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "sk-test";
    mockRunChatbotOpenAI.mockResolvedValue({
      status: "done",
      apiMessages: [{ role: "assistant", content: "OK" }],
    });
  });

  afterEach(() => {
    if (envOpenAI === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = envOpenAI;
  });

  it("lastUserMessageText returns the latest user string", () => {
    expect(
      lastUserMessageText([
        { role: "user", content: "ancien" },
        { role: "assistant", content: "réponse" },
        { role: "user", content: "  récent  " },
      ]),
    ).toBe("récent");
  });

  it("resolveChatbotToolScopeFromBody returns undefined to allow all tools when no explicit scope is provided", () => {
    const scope = resolveChatbotToolScopeFromBody(
      null,
      [{ role: "user", content: "facture Dupont 500€" }],
      true,
    );
    expect(scope).toBeUndefined();
  });

  it("returns 400 when companyId is missing", async () => {
    const res = await handleChatbotPost({ messages: [{ role: "user", content: "hi" }] }, auth);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "companyId requis" });
  });

  it("returns 400 when messages are empty", async () => {
    const res = await handleChatbotPost({ companyId: "co-test", messages: [] }, auth);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "messages requis" });
  });

  it("confirmTool zero-token UI streams document_preview without OpenAI", async () => {
    mockExecuteChatbotTool.mockResolvedValue({
      ok: true,
      interventionId: "iv-fourche",
      documentType: "invoice",
    });

    const res = await handleChatbotPost(
      {
        companyId: "co-test",
        messages: [{ role: "user", content: "affiche la facture" }],
        confirmTool: {
          name: "focus_intervention_document",
          toolUseId: "tool-1",
          input: { interventionId: "iv-fourche", documentType: "invoice" },
        },
      },
      auth,
    );

    expect(res.headers.get("Content-Type")).toMatch(/text\/event-stream/);
    expect(mockRunChatbotOpenAI).not.toHaveBeenCalled();
    expect(mockExecuteChatbotTool).toHaveBeenCalledWith(
      "focus_intervention_document",
      expect.objectContaining({ userConfirmed: true }),
      expect.objectContaining({ companyId: "co-test", actorUid: "uid-test" }),
    );

    const events = (await readSseJsonLines(res)) as any[];
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "document_preview",
          interventionId: "iv-fourche",
          documentType: "invoice",
        }),
      ]),
    );
  });

  it("returns SSE error when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    const res = await handleChatbotPost(
      {
        companyId: "co-test",
        messages: [{ role: "user", content: "Quel est le statut du dossier Dupont ?" }],
      },
      auth,
    );

    const events = (await readSseJsonLines(res)) as any[];
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "error",
          message: expect.stringMatching(/OPENAI_API_KEY/i),
        }),
      ]),
    );
    expect(mockRunChatbotOpenAI).not.toHaveBeenCalled();
  });

  it("confirmTool write action finishes without second OpenAI call", async () => {
    mockExecuteChatbotTool.mockResolvedValue({
      ok: true,
      interventionId: "iv-fourche",
      status: "done",
    });

    const res = await handleChatbotPost(
      {
        companyId: "co-test",
        messages: [
          { role: "user", content: "marque le dossier comme terminé" },
          {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "tool-status",
                name: "update_intervention_status",
                arguments: { interventionId: "iv-fourche", status: "done" },
              },
            ],
          },
        ],
        confirmTool: {
          name: "update_intervention_status",
          toolUseId: "tool-status",
          input: { interventionId: "iv-fourche", status: "done" },
        },
      },
      auth,
    );

    const events = (await readSseJsonLines(res)) as any[];
    expect(mockRunChatbotOpenAI).not.toHaveBeenCalled();
    expect(events.some((e) => e.type === "done")).toBe(true);
    expect(mockExecuteChatbotTool).toHaveBeenCalled();
  });

  it("affiche le pdf uses PWA route without OpenAI when snapshot + focus dossier", async () => {
    mockExecuteChatbotTool.mockResolvedValue({
      ok: true,
      interventionId: "iv-vatsaev",
      documentType: "invoice",
    });

    const res = await handleChatbotPost(
      {
        companyId: "co-test",
        workspaceSnapshot: buildChatbotTestSnapshot(),
        focusInterventionId: "iv-lombard",
        messages: [{ role: "user", content: "affiche le pdf" }],
      },
      auth,
    );

    const events = (await readSseJsonLines(res)) as Array<{ type: string }>;
    expect(mockRunChatbotOpenAI).not.toHaveBeenCalled();
    expect(mockExecuteChatbotTool).toHaveBeenCalledWith(
      "focus_intervention_document",
      expect.objectContaining({ interventionId: "iv-lombard", documentType: "invoice" }),
      expect.any(Object),
    );
    expect(events.some((e) => e.type === "document_preview")).toBe(true);
    expect(events.some((e) => e.type === "done")).toBe(true);
  });

  it("returns instant Lecot catalogue for serrure without OpenAI", async () => {
    const res = await handleChatbotPost(
      {
        companyId: "co-test",
        companyName: "Test SA",
        messages: [{ role: "user", content: "propose 5 serrures pour lecot" }],
      },
      auth,
    );

    const events = (await readSseJsonLines(res)) as Array<{ type: string }>;
    expect(mockRunChatbotOpenAI).not.toHaveBeenCalled();
    expect(events.some((e) => e.type === "text")).toBe(true);
    expect(events.some((e) => e.type === "quick_actions")).toBe(true);
    expect(events.some((e) => e.type === "done")).toBe(true);
  });

  it("places instant Lecot order on Commander SKU without OpenAI", async () => {
    mockExecuteChatbotTool.mockResolvedValue({
      ok: true,
      supplierOrderId: "ord-instant",
      lines: [{ sku: "LEC-SER-1001", label: "Serrure", quantity: 1 }],
    });

    const assistant = `**Catalogue Lecot** :
1. [Serrure multipoints Vachette Radialis 3 points](lecot:https://lecot.be) — 145,00 € HT (SKU LEC-SER-1001)`;

    const res = await handleChatbotPost(
      {
        companyId: "co-test",
        messages: [
          { role: "user", content: "serrure lecot" },
          { role: "assistant", content: assistant },
          {
            role: "user",
            content: "Commander LEC-SER-1001 — Serrure multipoints Vachette Radialis 3 points",
          },
        ],
      },
      auth,
    );

    const events = (await readSseJsonLines(res)) as Array<{ type: string }>;
    expect(mockRunChatbotOpenAI).not.toHaveBeenCalled();
    expect(mockExecuteChatbotTool).toHaveBeenCalledWith(
      "order_lecot_parts",
      expect.objectContaining({
        lines: expect.arrayContaining([
          expect.objectContaining({ sku: "LEC-SER-1001", quantity: 1 }),
        ]),
      }),
      expect.objectContaining({ companyId: "co-test" }),
    );
    expect(events.some((e) => e.type === "tool_start")).toBe(true);
    expect(events.some((e) => e.type === "done")).toBe(true);
  });

  it("returns instant Lecot catalogue for commande serrure client", async () => {
    const res = await handleChatbotPost(
      {
        companyId: "co-test",
        messages: [
          {
            role: "user",
            content: "tu peux commander pour le client vatsaev une serrure sur lecot",
          },
        ],
      },
      auth,
    );

    const events = (await readSseJsonLines(res)) as Array<Record<string, unknown>>;
    expect(mockRunChatbotOpenAI).not.toHaveBeenCalled();
    const textEv = events.find((e) => e.type === "text");
    expect(String(textEv?.delta ?? "")).toMatch(/Catalogue Lecot/i);
  });
  it("returns undefined to allow all tools when follow-up is only une serrure", async () => {
    const scope = resolveChatbotToolScopeFromBody(
      { toolScope: [] },
      [
        { role: "user", content: "commande lecot" },
        { role: "user", content: "une serrure" },
      ],
      true,
    );
    expect(scope).toBeUndefined();
  });

  it("delegates to runChatbotOpenAI with explicit toolScope", async () => {
    const res = await handleChatbotPost(
      {
        companyId: "co-test",
        companyName: "Test SA",
        messages: [{ role: "user", content: "liste les techniciens" }],
        toolScope: ["list_technicians"],
      },
      auth,
    );

    await readSseJsonLines(res);

    expect(mockRunChatbotOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        toolScope: [...CHATBOT_TOOL_CORE_NO_SNAPSHOT, "list_technicians"],
        toolCtx: expect.objectContaining({ companyId: "co-test", actorUid: "uid-test" }),
      }),
    );
  });
});
