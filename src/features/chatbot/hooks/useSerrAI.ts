"use client";

import { useCallback, useState } from "react";
import type {
  SerrAIConversation,
  SerrAIPendingTool,
  SerrAIStreamEvent,
} from "@/features/chatbot/serrAI-types";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";

function newConversationObj(): SerrAIConversation {
  return {
    id: crypto.randomUUID(),
    title: "Conversation",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    apiMessages: [],
  };
}

export function useSerrAI() {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId ?? "";

  const [conversations, setConversations] = useState<SerrAIConversation[]>(() => [
    newConversationObj(),
  ]);
  const [activeId, setActiveId] = useState<string>(conversations[0]!.id);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [pendingTool, setPendingTool] = useState<SerrAIPendingTool | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingApiMessages, setPendingApiMessages] = useState<unknown[]>([]);

  const activeConversation = conversations.find((c) => c.id === activeId);

  const newConversation = useCallback(() => {
    const c = newConversationObj();
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
    setStreamingText("");
    setPendingTool(null);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      const userMsg = {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: text.trim(),
        createdAt: Date.now(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, userMsg], updatedAt: Date.now() }
            : c
        )
      );
      setStreaming(true);
      setStreamingText("");
      setError(null);

      const currentConv = conversations.find((c) => c.id === activeId);
      const apiMessages = currentConv?.apiMessages ?? [];

      try {
        const res = await fetchWithAuth("/api/ai/serrai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId, message: text.trim(), apiMessages }),
        });

        if (!res.ok) throw new Error(`Erreur serveur ${res.status}`);

        const reader = res.body?.getReader();
        if (!reader) throw new Error("Stream indisponible");

        const decoder = new TextDecoder();
        let acc = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt = JSON.parse(line.slice(6)) as SerrAIStreamEvent;
              if (evt.type === "text") {
                acc += evt.delta;
                setStreamingText(acc);
              } else if (evt.type === "tool_pending") {
                setPendingTool(evt.pending);
                setPendingApiMessages(apiMessages);
              } else if (evt.type === "done") {
                const assistantMsg = {
                  id: crypto.randomUUID(),
                  role: "assistant" as const,
                  content: acc,
                  createdAt: Date.now(),
                };
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === activeId
                      ? {
                          ...c,
                          messages: [...c.messages, assistantMsg],
                          apiMessages: evt.apiMessages ?? apiMessages,
                          updatedAt: Date.now(),
                        }
                      : c
                  )
                );
              } else if (evt.type === "error") {
                setError(evt.message);
              }
            } catch {
              // skip malformed SSE line
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        setStreaming(false);
        setStreamingText("");
      }
    },
    [activeId, companyId, conversations, streaming]
  );

  const confirmPendingTool = useCallback(() => {
    setPendingTool(null);
  }, []);

  const cancelPendingTool = useCallback(() => {
    setPendingTool(null);
  }, []);

  return {
    companyId,
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    newConversation,
    sendMessage,
    streaming,
    streamingText,
    pendingTool,
    confirmPendingTool,
    cancelPendingTool,
    error,
  };
}
