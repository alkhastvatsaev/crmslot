"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useTranslation } from "@/core/i18n/I18nContext";
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
  const [messages, setMessages] = useState<CopilotChatMessage[]>(() => [welcomeMessage(t)]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

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
      setDraft("");
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

  const send = useCallback(() => void sendText(draft), [draft, sendText]);

  useEffect(() => {
    if (!externalPrompt?.trim()) return;
    void sendText(externalPrompt);
    onExternalPromptConsumed?.();
  }, [externalPrompt, onExternalPromptConsumed, sendText]);

  const disabledInput = typing || loadingSnapshot || !snapshot;

  return (
    <div
      data-testid="pwa-copilot-chat-panel"
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white/70 px-4 py-3 backdrop-blur-md">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-500/25">
          <Bot className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-slate-900">{t("copilot.title")}</p>
          <p className="truncate text-[11px] text-slate-500">
            {snapshot?.company.name
              ? t("copilot.subtitle_company").replace("{name}", snapshot.company.name)
              : loadingSnapshot
                ? t("copilot.loading_context")
                : t("copilot.no_company")}
          </p>
        </div>
        {snapshot ? (
          <span
            data-testid="pwa-copilot-context-badge"
            className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800"
          >
            {t("copilot.context_live")}
          </span>
        ) : null}
      </div>

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

      <div className="shrink-0 border-t border-slate-200/80 bg-white/80 p-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <label htmlFor="pwa-copilot-input" className="sr-only">
            {t("copilot.input_label")}
          </label>
          <div className="flex min-w-0 flex-1 items-center rounded-[18px] border border-slate-200 bg-white shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20">
            <textarea
              id="pwa-copilot-input"
              data-testid="pwa-copilot-input"
              rows={1}
              value={draft}
              disabled={disabledInput}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={t("copilot.input_placeholder")}
              className="min-h-12 max-h-28 flex-1 resize-none overflow-y-auto bg-transparent px-4 py-3 text-[13px] leading-[18px] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            data-testid="pwa-copilot-send"
            onClick={() => void send()}
            disabled={!draft.trim() || disabledInput}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition",
              !draft.trim() || disabledInput
                ? "cursor-not-allowed text-slate-400 opacity-40"
                : "text-indigo-600 hover:bg-indigo-500/10"
            )}
            aria-label={t("copilot.send_aria")}
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
