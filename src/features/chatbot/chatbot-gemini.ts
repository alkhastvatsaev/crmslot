import {
  GoogleGenerativeAI,
  FunctionCallingMode,
  type Content,
  type FunctionDeclaration,
  type Part,
} from "@google/generative-ai";
import { CHATBOT_TOOL_DEFINITIONS, isChatbotWriteTool } from "@/features/chatbot/chatbot-tools";
import { executeChatbotTool, type ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";

export type ChatbotStoredMessage =
  | { role: "user"; content: string }
  | {
      role: "model";
      content?: string;
      functionCalls?: Array<{ name: string; args: Record<string, unknown> }>;
    }
  | {
      role: "user";
      functionResponses: Array<{ name: string; response: Record<string, unknown> }>;
    };

export type ChatbotStreamEmit = (event: {
  type: "text";
  delta: string;
}) => void;

function geminiTools(): FunctionDeclaration[] {
  return CHATBOT_TOOL_DEFINITIONS.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.input_schema as FunctionDeclaration["parameters"],
  }));
}

function pendingSummary(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "update_intervention_status":
      return `Passer l'intervention ${input.interventionId} au statut « ${input.status} »`;
    case "assign_technician":
      return `Assigner le technicien ${input.technicianUid} sur ${input.interventionId}`;
    case "update_intervention_schedule":
      return `Planifier ${input.interventionId} le ${input.scheduledDate} à ${input.scheduledTime}`;
    case "add_timeline_comment":
      return `Ajouter une note interne sur ${input.interventionId}`;
    case "send_intervention_email":
      return `Envoyer un email à ${input.to} — objet : « ${String(input.subject || "").slice(0, 80)} » (dossier ${input.interventionId})`;
    default:
      return `Action : ${name}`;
  }
}

/** Convertit l'historique client (texte simple + tours outils) en `Content[]` Gemini. */
export function toGeminiHistory(messages: unknown[]): Content[] {
  const out: Content[] = [];
  for (const raw of messages) {
    if (!raw || typeof raw !== "object") continue;
    const m = raw as ChatbotStoredMessage & Record<string, unknown>;

    if (m.role === "user" && typeof m.content === "string") {
      out.push({ role: "user", parts: [{ text: m.content }] });
      continue;
    }

    if (m.role === "user" && Array.isArray(m.functionResponses)) {
      out.push({
        role: "user",
        parts: m.functionResponses.map((fr) => ({
          functionResponse: {
            name: fr.name,
            response: fr.response,
          },
        })),
      });
      continue;
    }

    if (m.role === "model") {
      const parts: Part[] = [];
      if (typeof m.content === "string" && m.content.trim()) {
        parts.push({ text: m.content });
      }
      if (Array.isArray(m.functionCalls)) {
        for (const fc of m.functionCalls) {
          parts.push({ functionCall: { name: fc.name, args: fc.args } });
        }
      }
      if (parts.length > 0) out.push({ role: "model", parts });
    }
  }
  return out;
}

export function normalizeStoredMessages(messages: unknown[]): ChatbotStoredMessage[] {
  const out: ChatbotStoredMessage[] = [];
  for (const raw of messages) {
    if (!raw || typeof raw !== "object") continue;
    const m = raw as Record<string, unknown>;
    if (m.role === "user" && typeof m.content === "string") {
      out.push({ role: "user", content: m.content });
    } else if (m.role === "user" && Array.isArray(m.functionResponses)) {
      out.push({
        role: "user",
        functionResponses: m.functionResponses as Array<{
          name: string;
          response: Record<string, unknown>;
        }>,
      });
    } else if (m.role === "model") {
      out.push({
        role: "model",
        content: typeof m.content === "string" ? m.content : undefined,
        functionCalls: Array.isArray(m.functionCalls)
          ? (m.functionCalls as Array<{ name: string; args: Record<string, unknown> }>)
          : undefined,
      });
    }
  }
  return out;
}

export type GeminiRunResult =
  | { status: "done"; apiMessages: ChatbotStoredMessage[] }
  | {
      status: "pending";
      apiMessages: ChatbotStoredMessage[];
      pending: {
        toolUseId: string;
        name: string;
        input: Record<string, unknown>;
        summary: string;
      };
    };

const MAX_ROUNDS = 8;

export async function runChatbotGemini(params: {
  apiKey: string;
  modelName: string;
  system: string;
  messages: unknown[];
  toolCtx: ChatbotToolContext;
  emit: ChatbotStreamEmit;
}): Promise<GeminiRunResult> {
  const stored = normalizeStoredMessages(params.messages);
  if (stored.length === 0) {
    throw new Error("Historique vide");
  }

  const genAI = new GoogleGenerativeAI(params.apiKey);
  const model = genAI.getGenerativeModel({
    model: params.modelName,
    systemInstruction: params.system,
    tools: [{ functionDeclarations: geminiTools() }],
    toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
    generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
  });

  const last = stored[stored.length - 1];
  const history =
    last.role === "user" && "content" in last
      ? toGeminiHistory(stored.slice(0, -1))
      : toGeminiHistory(stored.slice(0, -1));
  let lastUser: ChatbotStoredMessage =
    last.role === "user"
      ? last
      : { role: "user", content: "Continue." };

  const chat = model.startChat({ history });
  let apiMessages = [...stored];

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const sendPayload =
      "functionResponses" in lastUser
        ? lastUser.functionResponses.map((fr) => ({
            functionResponse: { name: fr.name, response: fr.response },
          }))
        : lastUser.content;

    const streamResult = await chat.sendMessageStream(sendPayload);
    let textAcc = "";

    for await (const chunk of streamResult.stream) {
      try {
        const t = chunk.text();
        if (t) {
          textAcc += t;
          params.emit({ type: "text", delta: t });
        }
      } catch {
        // function-call chunk — no text content
      }
    }

    const response = await streamResult.response;
    const functionCalls = response.functionCalls();

    if (!functionCalls?.length) {
      if (textAcc.trim()) {
        apiMessages = [...apiMessages, { role: "model", content: textAcc.trim() }];
      }
      return { status: "done", apiMessages };
    }

    const calls = functionCalls.map((fc) => ({
      name: fc.name,
      args: (fc.args ?? {}) as Record<string, unknown>,
    }));

    const modelTurn: ChatbotStoredMessage = {
      role: "model",
      content: textAcc.trim() || undefined,
      functionCalls: calls,
    };
    apiMessages = [...apiMessages, modelTurn];

    const functionResponses: Array<{ name: string; response: Record<string, unknown> }> = [];

    for (const fc of calls) {
      const isWrite = isChatbotWriteTool(fc.name);
      const confirmed = fc.args.userConfirmed === true;

      if (isWrite && !confirmed) {
        return {
          status: "pending",
          apiMessages,
          pending: {
            toolUseId: fc.name,
            name: fc.name,
            input: fc.args,
            summary: pendingSummary(fc.name, fc.args),
          },
        };
      }

      try {
        const result = await executeChatbotTool(fc.name, fc.args, params.toolCtx);
        functionResponses.push({
          name: fc.name,
          response:
            typeof result === "object" && result !== null
              ? (result as Record<string, unknown>)
              : { value: result },
        });
      } catch (err) {
        functionResponses.push({
          name: fc.name,
          response: {
            error: err instanceof Error ? err.message : "Erreur outil",
          },
        });
      }
    }

    const userToolTurn: ChatbotStoredMessage = {
      role: "user",
      functionResponses,
    };
    apiMessages = [...apiMessages, userToolTurn];
    lastUser = userToolTurn;
  }

  return { status: "done", apiMessages };
}
