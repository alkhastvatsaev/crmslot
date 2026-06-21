import OpenAI from "openai";
import { logger } from "@/core/logger";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { CHATBOT_TOOL_DEFINITIONS, isChatbotWriteTool } from "@/features/chatbot/chatbot-tools";
import { shouldAutoConfirmChatbotBillingWrite } from "@/features/chatbot/chatbot-billing-parse";
import { normalizeSendInterventionEmailArguments } from "@/features/chatbot/chatbot-email-attach";
import { shouldAutoConfirmChatbotEmailWrite } from "@/features/chatbot/chatbot-email-intent";
import { buildChatbotPostToolReply } from "@/features/chatbot/chatbot-post-tool-reply";
import { filterChatbotToolDefinitions } from "@/features/chatbot/chatbot-tool-routing";
import { stringifyChatbotToolResult } from "@/features/chatbot/compactChatbotToolResult";
import { trimChatbotMessagesForApi } from "@/features/chatbot/chatbot-message-trim";
import type { ChatbotConversationContext } from "@/features/chatbot/chatbot-conversation-context";
import { resolveChatbotConversationContext } from "@/features/chatbot/chatbot-conversation-context";
import { buildLecotProductQuickActions } from "@/features/chatbot/chatbot-quick-actions";
import {
  materialAgentAskClientNameAssistantContent,
  isMaterialAgentLecotCommandText,
} from "@/features/featureHub/materialAgentOrderClient";
import {
  extractDocumentPreviewFromResult,
  isChatbotZeroTokenUiTool,
  MINIMAL_DOCUMENT_TOOL_RESULT_JSON,
  documentToolSuccessMessage,
} from "@/features/chatbot/chatbot-document-side-effect";
import { emitChatbotOrderRegisteredEvents } from "@/features/chatbot/chatbot-order-side-effect";
import {
  emitHubAgentToolSideEffects,
  hubUiToolSuccessMessage,
} from "@/features/hubAgents/hubAgentSideEffects";
import { HUB_AGENT_IMMEDIATE_UI_TOOLS } from "@/features/hubAgents/hubAgentToolScopes";
import {
  executeChatbotTool,
  type ChatbotToolContext,
} from "@/features/chatbot/chatbot-tool-executor";
import {
  normalizeStoredMessages,
  type ChatbotStoredMessage,
} from "@/features/chatbot/chatbot-stored-messages";
import type { ChatbotStreamEmit } from "@/features/chatbot/chatbot-types";

export type { ChatbotStoredMessage } from "@/features/chatbot/chatbot-stored-messages";
export { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";
export type { ChatbotStreamEmit } from "@/features/chatbot/chatbot-types";

/** Commande Lecot : quantité 1 si le modèle omet ou demande quantity à l'utilisateur. */
export function normalizeLecotOrderToolArguments(args: Record<string, unknown>): void {
  if (!Array.isArray(args.lines)) return;
  for (const row of args.lines) {
    if (!row || typeof row !== "object") continue;
    const line = row as Record<string, unknown>;
    const q = Number(line.quantity);
    if (!Number.isFinite(q) || q <= 0) line.quantity = 1;
  }
}

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
  list_gmail_inbox: "Gmail — boîte",
  get_gmail_message: "Gmail — lecture",
  suggest_gmail_intervention_links: "Gmail — dossiers suggérés",
  send_gmail_reply: "Gmail — réponse",
  link_gmail_to_intervention: "Gmail — lien dossier",
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
  save_client_email: "Email client",
  send_intervention_email: "Envoi email",
  focus_intervention_document: "PDF PWA",
  patch_intervention_billing: "Facturation",
  update_intervention_billing: "Facturation",
  search_lecot_products: "Catalogue Lecot",
  list_supplier_orders: "Commandes fournisseur",
  order_lecot_parts: "Commande Lecot",
  list_company_material_orders: "Bons matériel société",
  approve_material_orders: "Validation demandes matériel",
  focus_stock_item: "Focus stock",
  focus_billing_case: "Focus facturation",
  open_crm_dossier: "Ouvrir dossier",
  trigger_accounting_export: "Export comptable CSV",
  trigger_payroll_export: "Export feuilles de temps",
  list_vehicle_stock: "Stock véhicule",
  add_vehicle_stock_item: "Ajout stock véhicule",
  update_vehicle_stock_item: "Mise à jour stock véhicule",
  diagnose_equipment_photo: "Diagnostic IA photo",
  parse_voice_job_closure: "Clôture vocale IA",
  get_contract_churn_risks: "Risque résiliation contrats",
};

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

const MAX_ROUNDS = 5;

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
      const eur =
        input.unitPriceEur ??
        (input.unitPriceCents != null ? Number(input.unitPriceCents) / 100 : null);
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
    case "send_gmail_reply":
      return `Répondre au mail ${input.messageId} : « ${String(input.bodyText || "").slice(0, 80)} »`;
    case "link_gmail_to_intervention":
      return `Lier le mail ${input.messageId} au dossier ${input.interventionId}`;
    default:
      return `Action : ${name}`;
  }
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
  conversationContext?: ChatbotConversationContext;
  hasWorkspaceSnapshot?: boolean;
  /** Agents hub dédiés : auto-confirme les écritures (sauf order_lecot). */
  hubAgentMode?: boolean;
  /** Désactive le garde-fou anti-chaînage search→order (ex : commande directe depuis modal). */
  skipLecotChainGuard?: boolean;
  /** Température OpenAI (défaut 0.25). Les agents déterministes peuvent descendre à 0.15. */
  temperature?: number;
  emit: ChatbotStreamEmit;
}): Promise<OpenAIRunResult> {
  const stored = trimChatbotMessagesForApi(normalizeStoredMessages(params.messages));
  if (stored.length === 0) {
    throw new Error("Historique vide");
  }

  const ctx =
    params.conversationContext ??
    resolveChatbotConversationContext({
      messages: params.messages,
      hasWorkspaceSnapshot: Boolean(params.hasWorkspaceSnapshot),
      explicitToolScope: params.toolScope,
    });

  const lastUserText = ctx.lastUserText || null;
  const effectiveToolScope = params.toolScope ?? ctx.toolScope;

  const client = new OpenAI({ apiKey: params.apiKey });
  let apiMessages = [...stored];
  const openaiMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: params.system },
    ...toOpenAIMessages(stored),
  ];

  // Pré-exécution garantie : si le contexte détecte une requête Lecot, on appelle
  // search_lecot_products directement (sans passer par le modèle) et on injecte
  // le résultat dans l'historique. OpenAI génère ensuite la réponse textuelle.
  if (
    ctx.forceToolName === "search_lecot_products" &&
    ctx.lecotSearchQuery &&
    !params.hubAgentMode
  ) {
    const preCallId = `force_lecot_${Date.now()}`;
    const preArgs = { query: ctx.lecotSearchQuery, limit: 5 };
    params.emit({
      type: "tool_start",
      tool: "search_lecot_products",
      label: TOOL_LABELS["search_lecot_products"] ?? "Recherche Lecot",
    });
    const preResult = await executeChatbotTool("search_lecot_products", preArgs, {
      ...params.toolCtx,
      openAIApiKey: params.apiKey,
      openAIModelName: params.modelName,
    }).catch((err: unknown) => ({ error: err instanceof Error ? err.message : "Erreur outil" }));
    params.emit({ type: "tool_end", tool: "search_lecot_products" });
    if (preResult && typeof preResult === "object") {
      const suggestions = (preResult as { suggestions?: unknown }).suggestions;
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        const actions = buildLecotProductQuickActions(
          suggestions as Parameters<typeof buildLecotProductQuickActions>[0]
        );
        if (actions.length > 0) params.emit({ type: "quick_actions", actions });
      }
    }
    const preContent = stringifyChatbotToolResult("search_lecot_products", preResult);
    const preTurn: ChatbotStoredMessage = {
      role: "assistant",
      content: null,
      tool_calls: [{ id: preCallId, name: "search_lecot_products", arguments: preArgs }],
    };
    apiMessages = [
      ...apiMessages,
      preTurn,
      { role: "tool", tool_call_id: preCallId, content: preContent },
    ];
    openaiMessages.push(
      {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: preCallId,
            type: "function",
            function: { name: "search_lecot_products", arguments: JSON.stringify(preArgs) },
          },
        ],
      },
      { role: "tool", tool_call_id: preCallId, content: preContent }
    );
  }

  // Prevent order_lecot_parts from being auto-chained after search_lecot_products in the same session.
  // Set to true once search runs; cleared by returning to text-only round so OpenAI summarizes results.
  let searchedLecotInHub = false;

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const scopeForRound =
      params.hubAgentMode && searchedLecotInHub
        ? (effectiveToolScope ?? []).filter((t) => t !== "order_lecot_parts")
        : effectiveToolScope;
    const resolvedTools = openaiTools(scopeForRound);
    const maxTokens = round === 0 ? 640 : 480;

    const stream = await client.chat.completions.create({
      model: params.modelName,
      messages: openaiMessages,
      ...(resolvedTools.length > 0 ? { tools: resolvedTools, tool_choice: "auto" as const } : {}),
      temperature: params.temperature ?? 0.25,
      max_tokens: maxTokens,
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

    if (params.hubAgentMode && params.toolCtx.requireMaterialOrderClientName) {
      const orderCall = parsedCalls.find((c) => c.name === "order_lecot_parts");
      if (orderCall) {
        const rawFromAI = String(orderCall.arguments.clientName ?? "").trim();
        // Rejeter les hallucinations (textes de commande passés comme clientName).
        const aiNameValid =
          rawFromAI && !isMaterialAgentLecotCommandText(rawFromAI) && rawFromAI.length <= 80;
        // Fallback sur le client enregistré en session si l'IA n'en fournit pas de valide.
        const effectiveClient = aiNameValid
          ? rawFromAI
          : params.toolCtx.materialOrderClientName?.trim() || "";
        if (!effectiveClient) {
          const ask = materialAgentAskClientNameAssistantContent();
          params.emit({ type: "text", delta: ask });
          return {
            status: "done",
            apiMessages: [...apiMessages, { role: "assistant", content: ask }],
          };
        }
        // Injecter le nom résolu pour que l'exécuteur n'ait pas besoin de re-résoudre.
        orderCall.arguments.clientName = effectiveClient;
        const focusIv = params.toolCtx.materialOrderInterventionId?.trim();
        if (focusIv && !String(orderCall.arguments.interventionId ?? "").trim()) {
          orderCall.arguments.interventionId = focusIv;
        }
      }
    } else if (params.hubAgentMode) {
      const orderCall = parsedCalls.find((c) => c.name === "order_lecot_parts");
      if (orderCall) {
        const rawFromAI = String(orderCall.arguments.clientName ?? "").trim();
        const aiNameValid =
          rawFromAI && !isMaterialAgentLecotCommandText(rawFromAI) && rawFromAI.length <= 80;
        if (!aiNameValid && params.toolCtx.materialOrderClientName?.trim()) {
          orderCall.arguments.clientName = params.toolCtx.materialOrderClientName.trim();
        }
        const focusIv = params.toolCtx.materialOrderInterventionId?.trim();
        if (focusIv && !String(orderCall.arguments.interventionId ?? "").trim()) {
          orderCall.arguments.interventionId = focusIv;
        }
      }
    }

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

    for (const call of parsedCalls) {
      const isWrite = isChatbotWriteTool(call.name);
      let confirmed = call.arguments.userConfirmed === true;
      if (
        isWrite &&
        !confirmed &&
        (params.hubAgentMode ||
          shouldAutoConfirmChatbotBillingWrite(call.name, lastUserText) ||
          shouldAutoConfirmChatbotEmailWrite(call.name, lastUserText))
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
        normalizeLecotOrderToolArguments(call.arguments);
      }
      if (call.name === "send_intervention_email") {
        normalizeSendInterventionEmailArguments(call.arguments, lastUserText);
      }
    }

    for (const call of parsedCalls) {
      params.emit({
        type: "tool_start",
        tool: call.name,
        label: TOOL_LABELS[call.name] ?? call.name,
      });
    }

    const executed = await Promise.all(
      parsedCalls.map(async (call) => {
        try {
          const result = await executeChatbotTool(call.name, call.arguments, {
            ...params.toolCtx,
            lastUserText: params.toolCtx.lastUserText ?? lastUserText,
            openAIApiKey: params.apiKey,
            openAIModelName: params.modelName,
          });
          return { call, result };
        } catch (err) {
          logger.error(`[chatbot tool] ${call.name} failed:`, {
            error: err instanceof Error ? err.message : String(err),
          });
          return {
            call,
            result: { error: err instanceof Error ? err.message : "Erreur outil" },
          };
        }
      })
    );

    const toolResultMessages: ChatbotStoredMessage[] = [];

    for (const { call, result } of executed) {
      params.emit({ type: "tool_end", tool: call.name });

      emitHubAgentToolSideEffects(call.name, result, params.emit, params.toolCtx.companyId);

      const preview = extractDocumentPreviewFromResult(result);
      if (preview) {
        params.emit({ type: "document_preview", ...preview });
      }

      if (HUB_AGENT_IMMEDIATE_UI_TOOLS.has(call.name)) {
        const successMsg = hubUiToolSuccessMessage(call.name, result);
        params.emit({ type: "text", delta: successMsg });
        const content = MINIMAL_DOCUMENT_TOOL_RESULT_JSON;
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
        apiMessages = [
          ...apiMessages,
          ...toolResultMessages,
          { role: "assistant", content: successMsg },
        ];
        return { status: "done", apiMessages };
      }

      if (call.name === "order_lecot_parts") {
        emitChatbotOrderRegisteredEvents(params.emit, params.toolCtx.companyId, result);
        if (params.hubAgentMode) {
          const clientName = String(call.arguments.clientName ?? "").trim();
          if (clientName) {
            params.emit({ type: "material_order_client", clientName });
          }
        }
        if (result && typeof result === "object" && !("error" in result)) {
          const orderText = documentToolSuccessMessage("order_lecot_parts", result);
          params.emit({ type: "text", delta: orderText });
          apiMessages = [
            ...apiMessages,
            ...toolResultMessages,
            { role: "assistant", content: orderText },
          ];
          return { status: "done", apiMessages };
        }
      }

      if (call.name === "search_lecot_products" && result && typeof result === "object") {
        const suggestions = (result as { suggestions?: unknown }).suggestions;
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          const actions = buildLecotProductQuickActions(
            suggestions as Parameters<typeof buildLecotProductQuickActions>[0]
          );
          if (actions.length > 0) {
            params.emit({ type: "quick_actions", actions });
            if (params.hubAgentMode && !params.skipLecotChainGuard) searchedLecotInHub = true;
          }
        }
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

      if (
        call.name === "send_intervention_email" ||
        call.name === "save_client_email" ||
        call.name === "send_gmail_reply" ||
        call.name === "link_gmail_to_intervention"
      ) {
        const successMsg = buildChatbotPostToolReply(call.name, result);
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
