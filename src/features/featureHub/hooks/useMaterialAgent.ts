"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useHubAgentStreamHandler } from "@/features/hubAgents/handleHubAgentStreamEvent";
import { useCompanyStockAgentBridgeOptional } from "@/context/CompanyStockAgentBridgeContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";
import { isCompanyStockAgentInScope } from "@/features/featureHub/companyStockAgentScope";
import type { CompanyStockAgentContext, CompanyStockAgentMessage } from "@/features/featureHub/companyStockAgentTypes";
import type { ChatbotQuickAction } from "@/features/chatbot/chatbot-quick-actions";
import type { ChatbotStreamEvent } from "@/features/chatbot/chatbot-types";
import { trimChatbotMessagesForApi } from "@/features/chatbot/chatbot-message-trim";
import { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";
import {
  isAwaitingMaterialAgentClientName,
  shouldResetMaterialOrderClientSession,
} from "@/features/featureHub/materialAgentOrderClient";

// ── Suggestion tag extraction ────────────────────────────────────────────────

function extractSuggestions(text: string): string[] {
  const out: string[] = [];
  const re = /<suggestion>(.*?)<\/suggestion>/gi;
  let m = re.exec(text);
  while (m) {
    const s = m[1].trim();
    if (s) out.push(s);
    m = re.exec(text);
  }
  return out;
}

function stripSuggestions(text: string): string {
  return text.replace(/<suggestion>.*?<\/suggestion>/gi, "").trim();
}

// ── SSE reader ───────────────────────────────────────────────────────────────

async function readStream(
  res: Response,
  onEvent: (ev: ChatbotStreamEvent) => void,
): Promise<void> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `Erreur HTTP ${res.status}`;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      if (text.trim()) message = text.slice(0, 300);
    }
    onEvent({ type: "error", message });
    return;
  }
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        onEvent(JSON.parse(line) as ChatbotStreamEvent);
      } catch {
        /* non-JSON */
      }
    }
  }
  if (buffer.trim()) {
    try {
      onEvent(JSON.parse(buffer) as ChatbotStreamEvent);
    } catch {
      /* ignore */
    }
  }
}

// ── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "belmap-material-agent-v1";
const CLIENT_NAME_STORAGE_SUFFIX = ":order-client";

function loadOrderClientName(uid: string, companyId: string): string {
  if (typeof window === "undefined") return "";
  try {
    return (
      localStorage.getItem(`${STORAGE_KEY}${CLIENT_NAME_STORAGE_SUFFIX}:${uid}:${companyId}`) ?? ""
    ).trim();
  } catch {
    return "";
  }
}

function saveOrderClientName(uid: string, companyId: string, name: string) {
  if (typeof window === "undefined") return;
  try {
    const key = `${STORAGE_KEY}${CLIENT_NAME_STORAGE_SUFFIX}:${uid}:${companyId}`;
    if (name.trim()) localStorage.setItem(key, name.trim());
    else localStorage.removeItem(key);
  } catch {
    /* quota */
  }
}

function loadApiHistory(uid: string, companyId: string): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:api:${uid}:${companyId}`);
    return raw ? (JSON.parse(raw) as unknown[]) : [];
  } catch {
    return [];
  }
}

function saveApiHistory(uid: string, companyId: string, msgs: unknown[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_KEY}:api:${uid}:${companyId}`,
      JSON.stringify(msgs.slice(-80)),
    );
  } catch {
    /* quota */
  }
}

// ── Stock snapshot builder ────────────────────────────────────────────────────

function buildStockSnapshot(ctx: CompanyStockAgentContext): string | null {
  if (!ctx.items.length) return null;
  const m = ctx.metrics;
  const summary = {
    totalSkus: m.totalSkus,
    coveragePct: m.coveragePct,
    outCount: m.outCount,
    lowCount: m.lowCount,
    pendingFieldOrders: m.pendingFieldOrders,
    waitingMaterialJobs: m.waitingMaterialJobs,
    items: ctx.items.slice(0, 20).map((it) => ({
      id: it.id,
      ref: it.reference ?? null,
      desc: it.description,
      qty: it.quantity,
      threshold: it.alertThreshold,
    })),
  };
  try {
    return JSON.stringify(summary);
  } catch {
    return null;
  }
}

// ── Off-topic canned reply ────────────────────────────────────────────────────

const OFF_TOPIC_TEXT =
  "Je suis l'Agent Matériel — je traite uniquement le stock et les commandes matériel. Pour toute autre question, utilisez l'Assistant IA.";
const OFF_TOPIC_SUGGESTIONS = ["État du stock", "Alertes", "Recherche article"];

function nextId() {
  return `mat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

type Options = {
  enabled?: boolean;
  onAction?: (action: { searchQuery?: string | null; focusStockItemId?: string | null }) => void;
};

export function useMaterialAgent(ctx: CompanyStockAgentContext, options?: Options) {
  const workspace = useCompanyWorkspaceOptional();
  const rawId = (workspace?.activeCompanyId ?? "").trim();
  const resolvedId = rawId || (workspace?.isTenantUser ? DEMO_COMPANY_ID : null);
  const companyId = ctx.companyId || resolvedId || "";
  const uid = workspace?.firebaseUid ?? "anon";
  const companyName =
    workspace?.memberships?.find((m) => m.companyId === companyId)?.companyName ??
    (companyId === DEMO_COMPANY_ID ? "Société démo" : null);
  const role = workspace?.activeRole ?? null;

  const agentEnabled = (options?.enabled !== false) && Boolean(companyId);
  const handleHubStream = useHubAgentStreamHandler({ companyId });
  const materialBridge = useCompanyStockAgentBridgeOptional();

  const storageKey = useMemo(() => `${uid}:${companyId}`, [uid, companyId]);
  const prevKeyRef = useRef(storageKey);

  const [messages, setMessages] = useState<CompanyStockAgentMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const bootedRef = useRef(false);

  const apiHistoryRef = useRef<unknown[]>(
    companyId ? loadApiHistory(uid, companyId) : [],
  );
  const orderClientNameRef = useRef(companyId ? loadOrderClientName(uid, companyId) : "");

  // Reset on company change
  if (prevKeyRef.current !== storageKey) {
    prevKeyRef.current = storageKey;
    apiHistoryRef.current = companyId ? loadApiHistory(uid, companyId) : [];
    orderClientNameRef.current = companyId ? loadOrderClientName(uid, companyId) : "";
    materialBridge?.setOrderClientName(orderClientNameRef.current);
  }

  useEffect(() => {
    if (!companyId || !materialBridge) return;
    const stored = loadOrderClientName(uid, companyId);
    if (stored) {
      orderClientNameRef.current = stored;
      materialBridge.setOrderClientName(stored);
    }
  }, [companyId, uid, materialBridge]);

  const pushMsg = useCallback((msg: CompanyStockAgentMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  /** Pas de message d'accueil — état vide = orb Galaxy (comme ChatbotChat). */
  const ensureWelcome = useCallback(() => {
    if (!agentEnabled) return;
    bootedRef.current = true;
  }, [agentEnabled]);

  const resetConversation = useCallback(() => {
    setMessages([]);
    apiHistoryRef.current = [];
    orderClientNameRef.current = "";
    materialBridge?.setOrderClientName("");
    bootedRef.current = false;
    if (companyId) {
      saveApiHistory(uid, companyId, []);
      saveOrderClientName(uid, companyId, "");
    }
  }, [uid, companyId, materialBridge]);

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || !agentEnabled || thinking) return;

      pushMsg({ id: nextId(), role: "user", text });

      if (shouldResetMaterialOrderClientSession(text)) {
        orderClientNameRef.current = "";
        materialBridge?.setOrderClientName("");
        if (companyId) saveOrderClientName(uid, companyId, "");
      }

      // Si l'agent attend le nom du client, laisser passer sans filtre scope.
      const awaitingClient = isAwaitingMaterialAgentClientName(apiHistoryRef.current);
      // Guard client : hors scope → réponse immédiate sans appel API
      if (!awaitingClient && !isCompanyStockAgentInScope(text)) {
        pushMsg({
          id: nextId(),
          role: "assistant",
          text: OFF_TOPIC_TEXT,
          suggestions: OFF_TOPIC_SUGGESTIONS,
        });
        return;
      }

      setThinking(true);

      const nextApi = [...apiHistoryRef.current, { role: "user", content: text }];
      apiHistoryRef.current = nextApi;

      const accText = { v: "" };
      const accQuickActions = { v: [] as ChatbotQuickAction[] };
      const finalApi = { v: nextApi as unknown[] };

      try {
        const res = await fetchWithAuth("/api/ai/material-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            companyName: companyName ?? companyId,
            role,
            messages: nextApi,
            orderClientName: orderClientNameRef.current || null,
            stockSnapshot: buildStockSnapshot(ctx),
          }),
        });

        await readStream(res, (ev) => {
          handleHubStream(ev);
          if (ev.type === "text") {
            accText.v += ev.delta;
          }
          if (ev.type === "quick_actions" && ev.actions.length > 0) {
            accQuickActions.v = ev.actions;
          }
          if (ev.type === "material_order_client") {
            const name = ev.clientName.trim();
            orderClientNameRef.current = name;
            materialBridge?.setOrderClientName(name);
            if (companyId) saveOrderClientName(uid, companyId, name);
          }
          if (ev.type === "focus_stock_hub") {
            options?.onAction?.({
              focusStockItemId: ev.stockItemId ?? null,
              searchQuery: ev.searchQuery ?? null,
            });
          }
          if (ev.type === "done" && ev.apiMessages) {
            finalApi.v = ev.apiMessages as unknown[];
          }
          if (ev.type === "error") {
            accText.v = `⚠️ ${ev.message}`;
          }
        });

        const rawText = accText.v.trim() || "⚠️ Pas de réponse.";
        const suggestions = extractSuggestions(rawText);
        const displayText = stripSuggestions(rawText);

        const trimmed = trimChatbotMessagesForApi(normalizeStoredMessages(finalApi.v));
        apiHistoryRef.current = trimmed;
        if (companyId) saveApiHistory(uid, companyId, trimmed);

        pushMsg({
          id: nextId(),
          role: "assistant",
          text: displayText,
          ...(accQuickActions.v.length ? { quickActions: accQuickActions.v } : {}),
          ...(suggestions.length && !accQuickActions.v.length ? { suggestions } : {}),
        });
      } catch (e) {
        pushMsg({
          id: nextId(),
          role: "assistant",
          text: `⚠️ ${e instanceof Error ? e.message : "Erreur réseau"}`,
        });
      } finally {
        setThinking(false);
      }
    },
    [agentEnabled, thinking, companyId, companyName, role, ctx, uid, options, pushMsg, handleHubStream],
  );

  return {
    messages,
    thinking,
    sendMessage,
    resetConversation,
    ensureWelcome,
    enabled: agentEnabled,
  };
}
