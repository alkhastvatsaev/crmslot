"use client";

import { useCallback } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { ChatbotUiMessage } from "@/features/chatbot/chatbot-types";
import { countChatbotUserTurns } from "@/features/chatbot/chatbot-latency";
import { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";
import { trimChatbotMessagesForApi } from "@/features/chatbot/chatbot-message-trim";
import {
  deriveChatbotQuickActions,
  mergeQuickActions,
  type ChatbotQuickAction,
} from "@/features/chatbot/chatbot-quick-actions";
import { readChatbotStream } from "@/features/chatbot/readChatbotStream";
import { saveChatbotConversations } from "@/features/chatbot/chatbotConversationStorage";
import type {
  ChatbotStreamCtx,
  ChatbotStreamEvent,
  UseChatbotStreamSessionArgs,
} from "@/features/chatbot/chatbotStreamSessionTypes";

type UseChatbotStreamRunArgs = Pick<
  UseChatbotStreamSessionArgs,
  | "companyId"
  | "companyName"
  | "role"
  | "storageKey"
  | "conversations"
  | "setConversations"
  | "workspaceSnapshot"
  | "focusInterventionId"
  | "appendToConversation"
  | "setStreaming"
  | "setStreamingText"
  | "setActiveTool"
  | "setError"
> & {
  handleStreamEvent: (ev: ChatbotStreamEvent, ctx: ChatbotStreamCtx) => void;
  syncAssistantBillingPanel: (assistantText: string, uiMessages: ChatbotUiMessage[]) => void;
  streamQuickActionsRef: { current: ChatbotQuickAction[] };
};

export function useChatbotStreamRun({
  companyId,
  companyName,
  role,
  storageKey,
  conversations,
  setConversations,
  workspaceSnapshot,
  focusInterventionId,
  appendToConversation,
  setStreaming,
  setStreamingText,
  setActiveTool,
  setError,
  handleStreamEvent,
  syncAssistantBillingPanel,
  streamQuickActionsRef,
}: UseChatbotStreamRunArgs) {
  const runStream = useCallback(
    async (
      convId: string,
      apiHistory: unknown[],
      extra?: {
        confirmTool?: { toolUseId: string; name: string; input: Record<string, unknown> };
        toolScope?: string[];
        omitWorkspaceSnapshot?: boolean;
      }
    ) => {
      if (!companyId) {
        setError("Sélectionnez une société active (switcher en haut) pour utiliser le Chatbot.");
        return;
      }

      setStreaming(true);
      setStreamingText("");
      setActiveTool(null);
      setError(null);
      streamQuickActionsRef.current = [];

      const accText = { v: "" };
      const streamError = { v: null as string | null };
      const nextApi = { v: apiHistory as unknown[] };

      try {
        const includeSnapshot =
          !extra?.omitWorkspaceSnapshot &&
          countChatbotUserTurns(apiHistory) <= 1 &&
          workspaceSnapshot != null;

        const res = await fetchWithAuth("/api/ai/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            companyName,
            role,
            messages: apiHistory,
            workspaceSnapshot: includeSnapshot ? workspaceSnapshot : undefined,
            toolScope: extra?.toolScope,
            focusInterventionId,
            conversationId: convId,
            ...extra,
          }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Erreur ${res.status}: ${body.slice(0, 200)}`);
        }

        await readChatbotStream(res, (ev) =>
          handleStreamEvent(ev, { accText, nextApi, streamError })
        );

        const finalText = (accText.v.trim() || streamError.v || "").trim();
        const trimmedApi = trimChatbotMessagesForApi(normalizeStoredMessages(nextApi.v));
        if (finalText) {
          const conv = conversations.find((c) => c.id === convId);
          const derived = deriveChatbotQuickActions(finalText);
          const actions = mergeQuickActions(streamQuickActionsRef.current, derived);
          streamQuickActionsRef.current = [];
          const assistantMsg: ChatbotUiMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: finalText,
            createdAt: Date.now(),
            ...(actions.length > 0 ? { actions } : {}),
          };
          const uiMessages = [...(conv?.messages ?? []), assistantMsg];
          syncAssistantBillingPanel(finalText, uiMessages);
          setConversations((prev) => {
            const next = prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: uiMessages,
                    apiMessages: trimmedApi,
                    updatedAt: Date.now(),
                    title:
                      c.title === "Nouvelle conversation" && uiMessages[0]
                        ? uiMessages[0].content.slice(0, 48)
                        : c.title,
                  }
                : c
            );
            saveChatbotConversations(storageKey, next);
            return next;
          });
        } else if (trimmedApi.length > normalizeStoredMessages(apiHistory).length) {
          setConversations((prev) => {
            const next = prev.map((c) =>
              c.id === convId ? { ...c, apiMessages: trimmedApi, updatedAt: Date.now() } : c
            );
            saveChatbotConversations(storageKey, next);
            return next;
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur réseau Chatbot";
        setError(msg);
        appendToConversation(convId, {
          uiMessages: [
            ...(conversations.find((c) => c.id === convId)?.messages ?? []),
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `⚠️ ${msg}`,
              createdAt: Date.now(),
            },
          ],
        });
      } finally {
        setStreaming(false);
        setStreamingText("");
        setActiveTool(null);
      }
    },
    [
      appendToConversation,
      companyId,
      companyName,
      conversations,
      focusInterventionId,
      handleStreamEvent,
      role,
      setActiveTool,
      setConversations,
      setError,
      setStreaming,
      setStreamingText,
      storageKey,
      syncAssistantBillingPanel,
      streamQuickActionsRef,
      workspaceSnapshot,
    ]
  );

  return runStream;
}
