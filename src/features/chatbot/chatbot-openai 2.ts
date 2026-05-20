import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { CHATBOT_TOOL_DEFINITIONS, isChatbotWriteTool } from "@/features/chatbot/chatbot-tools";
import { shouldAutoConfirmChatbotBillingWrite } from "@/features/chatbot/chatbot-billing-parse";
import { filterChatbotToolDefinitions } from "@/features/chatbot/chatbot-tool-routing";
import { stringifyChatbotToolResult } from "@/features/chatbot/compactChatbotToolResult";
import { trimChatbotMessagesForApi } from "@/features/chatbot/chatbot-message-trim";
import {
  extractDocumentPreviewFromResult,
  isChatbotZeroTokenUiTool,
  MINIMAL_DOCUMENT_TOOL_RESULT_JSON,
  documentToolSuccessMessage,
} from "@/features/chatbot/chatbot-document-side-effect";
import { emitChatbotOrderRegisteredEvents } from "@/features/chatbot/chatbot-order-side-effect";
import { executeChatbotTool, type ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";

export type ChatbotStoredMessage =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content?: string | null;
      tool_calls?: Array<{
        id: string;
        name: string;
        arguments: Record<string, unknown>;
      }>;
    }
  | { role: "tool"; tool_call_id: string; content: string };

const TOOL_LABELS: Record<string, string> = {
  get_workspace_summary: "Vue d'ensemble",
  list_interventions: "Interventions",
  get_intervention_detail: "Détails dossier",
  search_workspace: "Recherche",
  list_clients: "Clients",
  get_client_detail: "Fiche client",
  list_quotes: "Devis",
  list_technicians: "Techniciens",
  list_stock_alerts: "Stock",
  list_material_orders: "Commandes matériel",

  list_inbox_notifications: "Inbox",
  list_intervention_emails: "Emails dossier",
  get_intervention_billing: "Facturation",
  list_portal_chat: "Chat portail",
  get_technician_planning: "Planning technicien",
  statistiques_periode: "Statistiques",
  create_intervention: "Création dossier",
  update_intervention_status: "Mise à jour statut",
  assign_technician: "Assignation technicien",
  update_intervention_schedule: "Planification",
  add_timeline_comment: "Note interne",
  send_intervention_email: "Envoi email",
  focus_intervention_document: "PDF PWA",
  patch_intervention_billing: "Facturation",
  update_intervention_billing: "Facturation",
  search_lecot_products: "Catalogue Lecot",
  list_supplier_orders: "Commandes fournisseur",
  order_lecot_parts: "Commande Lecot",
};

export type ChatbotStreamEmit = (
  event:
    | { type: "text"; delta: string }
    | { type: "tool_start"; tool: string; label: string }
    | { type: "tool_end"; tool: string }
    | { type: "document_preview"; interventionId: string; documentType: string }
    | { type: "supplier_orders_panel"; highlightOrderId: string; materialOrderId?: string | null; previewOrder?: import("@/features/suppliers/types").SupplierOrder }
    | { type: "supplier_order_pdf"; companyId: string; orderId: string },
) => void;

export type OpenAIRunResult =
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

function openaiTools(toolScope?: string[]): ChatCompletionTool[] {
  const defs = filterChatbotToolDefinitions(CHATBOT_TOOL_DEFINITIONS, toolScope);
  return defs.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
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
    case "patch_intervention_billing": {
      const eur = input.unitPriceEur ?? (input.unitPriceCents != null ? Number(input.unitPriceCents) / 100 : null);
      const bits = [
        eur != null ? `prix ${eur} €` : null,
        input.clientName ? `client « ${String(input.clientName).slice(0, 40)} »` : null,
      ].filter(Boolean);
      return `Facture ${input.interventionId}${bits.length ? ` — ${bits.join(", ")}` : ""}`;
    }
    case "update_intervention_billing":
      return `Mettre à jour les lignes de facturation du dossier ${input.interventionId}`;
    case "order_lecot_parts": {
      const parts = Array.isArray(input.lines) ? input.lines : [];
      const count = parts.reduce((acc, p) => acc + (Number(p.quantity) || 1), 0);
      return `Commander ${count} pièce(s) chez Lecot`;
    }
    default:
      return `Action : ${name}`;
  }
}

/** Accepte le format OpenAI + ancien format Gemini côté client. */
export function normalizeStoredMessages(messages: unknown[]): ChatbotStoredMessage[] {
  const out: ChatbotStoredMessage[] = [];
  for (const raw of messages) {
    if (!raw || typeof raw !== "object") continue;
    const m = raw as Record<string, unknown>;

    if (m.role === "user" && typeof m.content === "string") {
      out.push({ role: "user", content: m.content });
      continue;
    }

    if (m.role === "tool" && typeof m.tool_call_id === "string") {
      out.push({
        role: "tool",
        tool_call_id: m.tool_call_id,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content ?? {}),
      });
      continue;
    }

    if (m.role === "assistant" || m.role === "model") {
      const tool_calls = Array.isArray(m.tool_calls)
        ? (m.tool_calls as Array<{ id: string; name: string; arguments: Record<string, unknown> }>)
        : Array.isArray(m.functionCalls)
          ? (m.functionCalls as Array<{ name: string; args: Record<string, unknown> }>).map(
              (fc, i) => ({
                id: `call_${fc.name}_${i}`,
                name: fc.name,
                arguments: fc.args,
              }),
            )
          : undefined;
      out.push({
        role: "assistant",
        content: typeof m.content === "string" ? m.content : null,
        tool_calls,
      });
      continue;
    }

    if (m.role === "user" && Array.isArray(m.functionResponses)) {
      for (const fr of m.functionResponses as Array<{ name: string; response: unknown }>) {
        out.push({
          role: "tool",
          tool_call_id: String(fr.name),
          content: JSON.stringify(fr.response ?? {}),
        });
      }
    }
  }
  return out;
}

function toOpenAIMessages(stored: ChatbotStoredMessage[]): ChatCompletionMessageParam[] {
  return stored.map((m) => {
    if (m.role === "user") {
      return { role: "user", content: m.content };
    }
    if (m.role === "tool") {
      return { role: "tool", tool_call_id: m.tool_call_id, content: m.content };
    }
    if (m.tool_calls?.length) {
      return {
        role: "assistant",
        content: m.content ?? null,
        tool_calls: m.tool_calls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        })),
      };
    }
    return { role: "assistant", content: m.content ?? "" };
  });
}

type ToolCallAccum = { id: string; name: string; arguments: string };

export async function runChatbotOpenAI(params: {
  apiKey: string;
  modelName: string;
  system: string;
  messages: unknown[];
  toolCtx: ChatbotToolContext;
  toolScope?: string[];
  emit: ChatbotStreamEmit;
}): Promise<OpenAIRunResult> {
  const stored = trimChatbotMessagesForApi(normalizeStoredMessages(params.messages));
  if (stored.length === 0) {
    throw new Error("Historique vide");
  }

  let lastUserText: string | null = null;
  for (let i = stored.length - 1; i >= 0; i -= 1) {
    const m = stored[i];
    if (m.role === "user" && typeof m.content === "string" && m.content.trim()) {
      lastUserText = m.content.trim();
      break;
    }
  }

  const client = new OpenAI({ apiKey: params.apiKey });
  let apiMessages = [...stored];
  const openaiMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: params.system },
    ...toOpenAIMessages(stored),
  ];

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const stream = await client.chat.completions.create({
      model: params.modelName,
      messages: openaiMessages,
      tools: openaiTools(params.toolScope),
      tool_choice: "auto",
      temperature: 0.35,
      max_tokens: 1024,
      stream: true,
    });

    let textAcc = "";
    const toolAcc: Record<number, ToolCallAccum> = {};

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      const delta = choice?.delta;
      if (delta?.content) {
        textAcc += delta.content;
        params.emit({ type: "text", delta: delta.content });
      }
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!toolAcc[idx]) {
            toolAcc[idx] = {
              id: tc.id?.trim() || `call_${idx}_${round}`,
              name: "",
              arguments: "",
            };
          }
          if (tc.id?.trim()) toolAcc[idx].id = tc.id.trim();
          if (tc.function?.name) toolAcc[idx].name = tc.function.name;
          if (tc.function?.arguments) toolAcc[idx].arguments += tc.function.arguments;
        }
      }
    }

    const toolCallsList = Object.values(toolAcc).filter((t) => t.name);

    if (toolCallsList.length === 0) {
      if (textAcc.trim()) {
        apiMessages = [...apiMessages, { role: "assistant", content: textAcc.trim() }];
      }
      return { status: "done", apiMessages };
    }

    const parsedCalls = toolCallsList.map((tc) => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.arguments || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      return { id: tc.id, name: tc.name, arguments: args };
    });

    const assistantTurn: ChatbotStoredMessage = {
      role: "assistant",
      content: textAcc.trim() || null,
      tool_calls: parsedCalls.map((c) => ({
        id: c.id,
        name: c.name,
        arguments: c.arguments,
      })),
    };
    apiMessages = [...apiMessages, assistantTurn];
    openaiMessages.push({
      role: "assistant",
      content: textAcc.trim() || null,
      tool_calls: parsedCalls.map((c) => ({
        id: c.id,
        type: "function",
        function: { name: c.name, arguments: JSON.stringify(c.arguments) },
      })),
    });

    const toolResultMessages: ChatbotStoredMessage[] = [];

    for (const call of parsedCalls) {
      const isWrite = isChatbotWriteTool(call.name);
      let confirmed = call.arguments.userConfirmed === true;
      if (
        isWrite &&
        !confirmed &&
        shouldAutoConfirmChatbotBillingWrite(call.name, lastUserText)
      ) {
        call.arguments.userConfirmed = true;
        confirmed = true;
      }

      if (isWrite && !confirmed && call.name !== "order_lecot_parts") {
        return {
          status: "pending",
          apiMessages,
          pending: {
            toolUseId: call.id,
            name: call.name,
            input: call.arguments,
            summary: pendingSummary(call.name, call.arguments),
          },
        };
      }

      if (call.name === "order_lecot_parts") {
        call.arguments.userConfirmed = true;
      }

      params.emit({ type: "tool_start", tool: call.name, label: TOOL_LABELS[call.name] ?? call.name });
      let result: unknown;
      try {
        result = await executeChatbotTool(call.name, call.arguments, params.toolCtx);
      } catch (err) {
        console.error(`[chatbot tool] ${call.name} failed:`, err);
        result = { error: err instanceof Error ? err.message : "Erreur outil" };
      }
      params.emit({ type: "tool_end", tool: call.name });

      const preview = extractDocumentPreviewFromResult(result);
      if (preview) {
        params.emit({ type: "document_preview", ...preview });
      }
      if (call.name === "order_lecot_parts") {
        emitChatbotOrderRegisteredEvents(params.emit, params.toolCtx.companyId, result);
      }

      const content = isChatbotZeroTokenUiTool(call.name)
        ? MINIMAL_DOCUMENT_TOOL_RESULT_JSON
        : stringifyChatbotToolResult(call.name, result);
      toolResultMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content,
      });
      openaiMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content,
      });

      if (isChatbotZeroTokenUiTool(call.name)) {
        const successMsg = documentToolSuccessMessage(call.name, result);
        params.emit({ type: "text", delta: successMsg });
        apiMessages = [
          ...apiMessages,
          ...toolResultMessages,
          { role: "assistant", content: successMsg },
        ];
        return { status: "done", apiMessages };
      }
    }

    apiMessages = [...apiMessages, ...toolResultMessages];
  }

  return { status: "done", apiMessages };
}
