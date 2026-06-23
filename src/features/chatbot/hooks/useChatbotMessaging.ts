"use client";

import { useCallback } from "react";
import type { ChatbotConversation, ChatbotPendingTool } from "@/features/chatbot/chatbot-types";
import { isChatbotConfirmationUtterance } from "@/features/chatbot/chatbot-confirm-utterance";
import { isChatbotPwaPendingToolId } from "@/features/chatbot/chatbot-pwa-intent";
import type { ChatbotVisionContent } from "@/features/chatbot/chatbot-stored-messages";
import type { useChatbotStreamSession } from "@/features/chatbot/hooks/useChatbotStreamSession";

type RunStream = ReturnType<typeof useChatbotStreamSession>["runStream"];
type RunDocumentActionInner = ReturnType<typeof useChatbotStreamSession>["runDocumentAction"];

type Args = {
  companyId: string | null;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  conversations: ChatbotConversation[];
  persist: (rows: ChatbotConversation[]) => void;
  appendToConversation: (
    convId: string,
    patch: {
      uiMessages?: ChatbotConversation["messages"];
      apiMessages?: unknown[];
      title?: string;
    }
  ) => void;
  pendingTool: ChatbotPendingTool | null;
  setPendingTool: (tool: ChatbotPendingTool | null) => void;
  setStreamingText: (text: string) => void;
  setError: (error: string | null) => void;
  streaming: boolean;
  runStream: RunStream;
  runDocumentActionInner: RunDocumentActionInner;
};

export function useChatbotMessaging({
  companyId,
  activeId,
  setActiveId,
  conversations,
  persist,
  appendToConversation,
  pendingTool,
  setPendingTool,
  setStreamingText,
  setError,
  streaming,
  runStream,
  runDocumentActionInner,
}: Args) {
  const runDocumentAction = useCallback(
    (action: Parameters<RunDocumentActionInner>[0], convId?: string | null) =>
      runDocumentActionInner(action, convId, activeId),
    [activeId, runDocumentActionInner]
  );

  const confirmPendingTool = useCallback(async () => {
    if (!pendingTool || !companyId || !activeId) return;
    const tool = pendingTool;
    setPendingTool(null);

    if (isChatbotPwaPendingToolId(tool.toolUseId) && tool.name === "patch_intervention_billing") {
      const interventionId = String(tool.input.interventionId ?? "").trim();
      if (!interventionId) return;
      await runDocumentAction(
        {
          action: "patch",
          interventionId,
          lineIndex: typeof tool.input.lineIndex === "number" ? tool.input.lineIndex : undefined,
          unitPriceEur:
            typeof tool.input.unitPriceEur === "number" ? tool.input.unitPriceEur : undefined,
          clientName: typeof tool.input.clientName === "string" ? tool.input.clientName : undefined,
          previewDocumentType: tool.input.previewDocumentType === "quote" ? "quote" : "invoice",
        },
        activeId
      );
      return;
    }

    const conv = conversations.find((c) => c.id === activeId);
    const apiHistory = conv?.apiMessages ?? [];
    await runStream(activeId, apiHistory, {
      confirmTool: {
        toolUseId: tool.toolUseId,
        name: tool.name,
        input: tool.input,
      },
    });
  }, [
    activeId,
    companyId,
    conversations,
    pendingTool,
    runDocumentAction,
    runStream,
    setPendingTool,
  ]);

  const sendMessage = useCallback(
    async (text: string, imageDataUrl?: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      if (pendingTool && isChatbotConfirmationUtterance(trimmed)) {
        await confirmPendingTool();
        return;
      }

      if (!companyId) {
        setError("Sélectionnez une société active pour utiliser le Chatbot.");
        return;
      }

      let convId = activeId;
      if (!convId) {
        const conv: ChatbotConversation = {
          id: crypto.randomUUID(),
          title: trimmed.slice(0, 48),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          apiMessages: [],
        };
        persist([conv, ...conversations]);
        convId = conv.id;
        setActiveId(convId);
      }

      const userMsg = {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: trimmed,
        createdAt: Date.now(),
      };

      const conv =
        conversations.find((c) => c.id === convId) ??
        ({
          id: convId,
          title: trimmed.slice(0, 48),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          apiMessages: [],
        } satisfies ChatbotConversation);

      const nextUi = [...conv.messages, userMsg];
      const userApiContent: string | ChatbotVisionContent = imageDataUrl
        ? [
            { type: "text" as const, text: trimmed },
            {
              type: "image_url" as const,
              image_url: { url: imageDataUrl },
            },
          ]
        : trimmed;
      const nextApi = [...(conv.apiMessages ?? []), { role: "user", content: userApiContent }];

      appendToConversation(convId, { uiMessages: nextUi, apiMessages: nextApi });

      await runStream(convId, nextApi);
    },
    [
      activeId,
      appendToConversation,
      companyId,
      confirmPendingTool,
      conversations,
      pendingTool,
      persist,
      runStream,
      setActiveId,
      setError,
      streaming,
    ]
  );

  const cancelPendingTool = useCallback(() => {
    if (!activeId) return;
    setPendingTool(null);
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) return;
    appendToConversation(activeId, {
      uiMessages: [
        ...conv.messages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Action annulée — aucune modification n'a été effectuée.",
          createdAt: Date.now(),
        },
      ],
    });
  }, [activeId, appendToConversation, conversations, setPendingTool]);

  const startNewConversation = useCallback(() => {
    setPendingTool(null);
    setStreamingText("");
    setError(null);
  }, [setError, setPendingTool, setStreamingText]);

  return {
    runDocumentAction,
    confirmPendingTool,
    sendMessage,
    cancelPendingTool,
    startNewConversation,
  };
}
