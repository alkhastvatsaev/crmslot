"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useHubAgentStreamHandler } from "@/features/hubAgents/handleHubAgentStreamEvent";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { isCompanyStockAgentInScope } from "@/features/featureHub/companyStockAgentScope";
import type {
  CompanyStockAgentContext,
  CompanyStockAgentMessage,
} from "@/features/featureHub/companyStockAgentTypes";
import type { ChatbotQuickAction } from "@/features/chatbot";
import { trimChatbotMessagesForApi } from "@/features/chatbot/chatbot-message-trim";
import { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";
import {
  buildMaterialAgentStockSnapshot,
  extractMaterialAgentSuggestions,
  loadMaterialAgentApiHistory,
  MATERIAL_AGENT_OFF_TOPIC_SUGGESTIONS,
  MATERIAL_AGENT_OFF_TOPIC_TEXT,
  nextMaterialAgentMessageId,
  saveMaterialAgentApiHistory,
  stripMaterialAgentSuggestions,
} from "@/features/featureHub/materialAgentHelpers";
import { readMaterialAgentStream } from "@/features/featureHub/materialAgentStream";

type Options = {
  enabled?: boolean;
  onAction?: (action: { searchQuery?: string | null; focusStockItemId?: string | null }) => void;
};

export function useMaterialAgent(ctx: CompanyStockAgentContext, options?: Options) {
  const workspace = useCompanyWorkspaceOptional();
  const rawId = (workspace?.activeCompanyId ?? "").trim();
  const resolvedId = rawId || workspace?.activeCompanyId?.trim() || null;
  const companyId = ctx.companyId || resolvedId || "";
  const uid = workspace?.firebaseUid ?? "anon";
  const companyName =
    workspace?.memberships?.find((m) => m.companyId === companyId)?.companyName ?? null;
  const role = workspace?.activeRole ?? null;

  const agentEnabled = options?.enabled !== false && Boolean(companyId);
  const handleHubStream = useHubAgentStreamHandler({ companyId });

  const storageKey = useMemo(() => `${uid}:${companyId}`, [uid, companyId]);
  const prevKeyRef = useRef(storageKey);

  const [messages, setMessages] = useState<CompanyStockAgentMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const bootedRef = useRef(false);

  const apiHistoryRef = useRef<unknown[]>(
    companyId ? loadMaterialAgentApiHistory(uid, companyId) : []
  );

  // Reset on company change
  if (prevKeyRef.current !== storageKey) {
    prevKeyRef.current = storageKey;
    apiHistoryRef.current = companyId ? loadMaterialAgentApiHistory(uid, companyId) : [];
  }

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
    bootedRef.current = false;
    if (companyId) {
      saveMaterialAgentApiHistory(uid, companyId, []);
    }
  }, [uid, companyId]);

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || !agentEnabled || thinking) return;

      pushMsg({ id: nextMaterialAgentMessageId(), role: "user", text });

      // Guard client : hors scope → réponse immédiate sans appel API
      if (!isCompanyStockAgentInScope(text)) {
        pushMsg({
          id: nextMaterialAgentMessageId(),
          role: "assistant",
          text: MATERIAL_AGENT_OFF_TOPIC_TEXT,
          suggestions: MATERIAL_AGENT_OFF_TOPIC_SUGGESTIONS,
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
            stockSnapshot: buildMaterialAgentStockSnapshot(ctx),
          }),
        });

        await readMaterialAgentStream(res, (ev) => {
          handleHubStream(ev);
          if (ev.type === "text") {
            accText.v += ev.delta;
          }
          if (ev.type === "quick_actions" && ev.actions.length > 0) {
            accQuickActions.v = ev.actions;
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
        const suggestions = extractMaterialAgentSuggestions(rawText);
        const displayText = stripMaterialAgentSuggestions(rawText);

        const trimmed = trimChatbotMessagesForApi(normalizeStoredMessages(finalApi.v));
        apiHistoryRef.current = trimmed;
        if (companyId) saveMaterialAgentApiHistory(uid, companyId, trimmed);

        pushMsg({
          id: nextMaterialAgentMessageId(),
          role: "assistant",
          text: displayText,
          ...(accQuickActions.v.length ? { quickActions: accQuickActions.v } : {}),
          ...(suggestions.length && !accQuickActions.v.length ? { suggestions } : {}),
        });
      } catch (e) {
        pushMsg({
          id: nextMaterialAgentMessageId(),
          role: "assistant",
          text: `⚠️ ${e instanceof Error ? e.message : "Erreur réseau"}`,
        });
      } finally {
        setThinking(false);
      }
    },
    [
      agentEnabled,
      thinking,
      companyId,
      companyName,
      role,
      ctx,
      uid,
      options,
      pushMsg,
      handleHubStream,
    ]
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
