"use client";

import { useCallback } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { logCrmAfterDocumentBilling } from "@/features/crmHistory/logCrmAfterDocumentBilling";
import { readChatbotStream } from "@/features/chatbot/readChatbotStream";
import type {
  ChatbotClientDocumentAction,
  ChatbotStreamCtx,
  ChatbotStreamEvent,
  UseChatbotStreamSessionArgs,
} from "@/features/chatbot/chatbotStreamSessionTypes";

type UseChatbotStreamDocumentActionArgs = Pick<
  UseChatbotStreamSessionArgs,
  | "companyId"
  | "role"
  | "conversations"
  | "appendToConversation"
  | "setStreaming"
  | "setStreamingText"
  | "setError"
> & {
  handleStreamEvent: (ev: ChatbotStreamEvent, ctx: ChatbotStreamCtx) => void;
};

export function useChatbotStreamDocumentAction({
  companyId,
  role,
  conversations,
  appendToConversation,
  setStreaming,
  setStreamingText,
  setError,
  handleStreamEvent,
}: UseChatbotStreamDocumentActionArgs) {
  const runDocumentAction = useCallback(
    async (
      action: ChatbotClientDocumentAction,
      convId?: string | null,
      activeId?: string | null
    ) => {
      if (!companyId) {
        setError("Sélectionnez une société active pour utiliser le Chatbot.");
        return;
      }

      const targetId = convId ?? activeId;
      setStreaming(true);
      setStreamingText("");
      setError(null);

      const accText = { v: "" };
      const streamError = { v: null as string | null };
      const nextApi = { v: [] as unknown[] };

      try {
        const res = await fetchWithAuth("/api/ai/chatbot/document-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId, role, ...action }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Erreur ${res.status}: ${body.slice(0, 200)}`);
        }

        await readChatbotStream(res, (ev) =>
          handleStreamEvent(ev, { accText, nextApi, streamError })
        );

        if (!streamError.v && (action.action === "patch" || action.action === "append_billing")) {
          void logCrmAfterDocumentBilling(action, companyId);
        }

        const finalText = (accText.v.trim() || streamError.v || "").trim();
        if (finalText && targetId) {
          const conv = conversations.find((c) => c.id === targetId);
          if (conv) {
            appendToConversation(targetId, {
              uiMessages: [
                ...conv.messages,
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: finalText,
                  createdAt: Date.now(),
                },
              ],
            });
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur document";
        setError(msg);
      } finally {
        setStreaming(false);
        setStreamingText("");
      }
    },
    [
      appendToConversation,
      companyId,
      conversations,
      handleStreamEvent,
      role,
      setError,
      setStreaming,
      setStreamingText,
    ]
  );

  return runDocumentAction;
}
