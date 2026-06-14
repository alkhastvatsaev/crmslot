"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useTranslation } from "@/core/i18n/I18nContext";
import { usePwaCopilotAgentBridgeOptional } from "@/context/PwaCopilotAgentBridgeContext";
import type { CopilotChatMessage, WorkspaceCopilotSnapshot } from "@/features/copilot/types";

type Props = {
  snapshot: WorkspaceCopilotSnapshot | null;
  loadingSnapshot?: boolean;
  className?: string;
  externalPrompt?: string | null;
  onExternalPromptConsumed?: () => void;
};

function welcomeMessage(t: (key: string) => string): CopilotChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: t("copilot.welcome"),
    createdAt: Date.now(),
  };
}

export default function PwaCopilotChatPanel({
  snapshot,
  loadingSnapshot = false,
  className,
  externalPrompt = null,
  onExternalPromptConsumed,
}: Props) {
  const { t } = useTranslation();
  const bridge = usePwaCopilotAgentBridgeOptional();
  const registerHandlers = bridge?.registerHandlers ?? (() => {});
  const [messages, setMessages] = useState<CopilotChatMessage[]>(() => [welcomeMessage(t)]);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sendTextRef = useRef<(text: string) => Promise<void>>(async () => {});

  useEffect(() => {
    setMessages([welcomeMessage(t)]);
    setError(null);
  }, [snapshot?.company.id, t]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;
      if (!snapshot) {
        setError(t("copilot.no_company"));
        return;
      }

      const userMsg: CopilotChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };

      const history = [...messages.filter((m) => m.id !== "welcome"), userMsg];
      setMessages((prev) => [...prev, userMsg]);
      setTyping(true);
      setError(null);

      try {
        const res = await fetchWithAuth("/api/ai/workspace-copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            snapshot,
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          reply?: string;
          error?: string;
          configured?: boolean;
        };

        if (!res.ok) {
          throw new Error(data.error || t("copilot.error_generic"));
        }

        const reply: CopilotChatMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply?.trim() || t("copilot.error_empty"),
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, reply]);
        if (data.configured === false) {
          setError(t("copilot.openai_missing"));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : t("copilot.error_generic");
        setError(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: msg,
            createdAt: Date.now(),
          },
        ]);
      } finally {
        setTyping(false);
      }
    },
    [messages, snapshot, t, typing]
  );

  sendTextRef.current = sendText;

  const bridgeSendMessage = useCallback((text: string) => {
    void sendTextRef.current(text);
  }, []);

  const bridgeReset = useCallback(() => {
    setMessages([welcomeMessage(t)]);
    setError(null);
  }, [t]);

  const disabledInput = typing || loadingSnapshot || !snapshot;

  useEffect(() => {
    registerHandlers({
      sendMessage: bridgeSendMessage,
      resetConversation: bridgeReset,
      disabled: disabledInput,
    });
    return () => registerHandlers(null);
  }, [bridgeSendMessage, bridgeReset, disabledInput, registerHandlers]);

  useEffect(() => {
    if (!externalPrompt?.trim()) return;
    void sendText(externalPrompt);
    onExternalPromptConsumed?.();
  }, [externalPrompt, onExternalPromptConsumed, sendText]);

  return (
    <div
      data-testid="pwa-copilot-chat-panel"
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      {error ? (
        <p
          className="shrink-0 bg-amber-50 px-4 py-2 text-[12px] text-amber-900"
          data-testid="pwa-copilot-error"
        >
          {error}
        </p>
      ) : null}

      <div
        ref={listRef}
        className={cn(
          GLASS_PANEL_BODY_SCROLL_COMPACT,
          "flex min-h-0 flex-1 flex-col gap-3 px-3 py-4"
        )}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            data-testid={
              m.role === "user" ? "pwa-copilot-bubble-user" : "pwa-copilot-bubble-assistant"
            }
            className={cn("flex w-full", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[92%] whitespace-pre-wrap rounded-[16px] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm",
                m.role === "user"
                  ? "rounded-br-md bg-indigo-600 text-white"
                  : "rounded-bl-md border border-slate-200/80 bg-white text-slate-800"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {typing ? (
          <div className="flex justify-start" data-testid="pwa-copilot-typing">
            <div className="rounded-[16px] rounded-bl-md border border-slate-200/80 bg-white px-4 py-3 text-[12px] font-medium text-slate-500 shadow-sm">
              {t("copilot.typing")}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
