"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatbotConversation, ChatbotUiMessage } from "@/features/chatbot/chatbot-types";
import {
  loadChatbotConversations,
  saveChatbotConversations,
} from "@/features/chatbot/chatbotConversationStorage";

export function useChatbotConversations(storageKey: string) {
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const rows = loadChatbotConversations(storageKey);
    setConversations(rows);
    setActiveId(rows[0]?.id ?? null);
  }, [storageKey]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  const persist = useCallback(
    (rows: ChatbotConversation[]) => {
      setConversations(rows);
      saveChatbotConversations(storageKey, rows);
    },
    [storageKey]
  );

  const appendToConversation = useCallback(
    (
      convId: string,
      patch: {
        uiMessages?: ChatbotUiMessage[];
        apiMessages?: unknown[];
        title?: string;
      }
    ) => {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: patch.uiMessages ?? c.messages,
                apiMessages: patch.apiMessages ?? c.apiMessages,
                title: patch.title ?? c.title,
                updatedAt: Date.now(),
              }
            : c
        );
        saveChatbotConversations(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const newConversation = useCallback(() => {
    const conv: ChatbotConversation = {
      id: crypto.randomUUID(),
      title: "Nouvelle conversation",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      apiMessages: [],
    };
    persist([conv, ...conversations]);
    setActiveId(conv.id);
    return conv.id;
  }, [conversations, persist]);

  return {
    conversations,
    setConversations,
    activeId,
    setActiveId,
    activeConversation,
    persist,
    appendToConversation,
    newConversation,
  };
}
