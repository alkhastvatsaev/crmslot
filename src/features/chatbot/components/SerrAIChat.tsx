"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bot, Loader2, MessageSquarePlus, Send, ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSerrAI } from "@/features/chatbot/hooks/useSerrAI";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";

const QUICK_PROMPTS = [
  "Briefing du jour",
  "Interventions urgentes non assignées",
  "Dossiers terminés non payés",
  "Résumé clients actifs",
  "Stock en alerte",
];

function renderMarkdownLite(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}
      data-testid={isUser ? "serrai-bubble-user" : "serrai-bubble-assistant"}
    >
      {!isUser && (
        <motion.div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md">
          <Bot className="h-4 w-4" />
        </motion.div>
      )}
      <motion.div
        className={cn(
          "max-w-[88%] whitespace-pre-wrap rounded-[18px] px-4 py-3 text-[14px] leading-relaxed",
          isUser
            ? "rounded-br-[6px] bg-slate-900 text-white"
            : "rounded-bl-[6px] border border-slate-100 bg-white text-slate-900 shadow-sm"
        )}
      >
        {isUser ? content : renderMarkdownLite(content)}
      </motion.div>
    </motion.div>
  );
}

export default function SerrAIChat({ className }: { className?: string }) {
  const {
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
  } = useSerrAI();

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [activeConversation?.messages, streamingText, pendingTool]);

  useEffect(() => {
    const onQuick = (e: Event) => {
      const text = (e as CustomEvent<{ text?: string }>).detail?.text;
      if (text?.trim()) void sendMessage(text);
    };
    window.addEventListener("serrai-quick-prompt", onQuick);
    return () => window.removeEventListener("serrai-quick-prompt", onQuick);
  }, [sendMessage]);

  const handleSend = () => {
    void sendMessage(input);
    setInput("");
  };

  return (
    <motion.div
      data-testid="serrai-chat"
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f9fc]", className)}
    >
      <motion.div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3">
        <motion.div className="flex items-center gap-3">
          <motion.div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-500/20">
            <Bot className="h-5 w-5" />
          </motion.div>
          <motion.div>
            <p className="text-[15px] font-bold text-slate-900">SerrAI</p>
            <p className="text-[11px] font-medium text-slate-500">
              OpenAI gpt-4o-mini · accès données PWA
            </p>
          </motion.div>
        </motion.div>
        <button
          type="button"
          data-testid="serrai-new-conversation"
          onClick={newConversation}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Nouveau
        </button>
      </motion.div>

      {conversations.length > 1 ? (
        <motion.div className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-100 bg-white/80 px-3 py-2">
          {conversations.slice(0, 8).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition",
                c.id === activeId
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {c.title.slice(0, 28)}
            </button>
          ))}
        </motion.div>
      ) : null}

      <motion.div
        className={cn(
          GLASS_PANEL_BODY_SCROLL_COMPACT,
          "flex min-h-0 flex-1 flex-col gap-4 px-4 py-4"
        )}
      >
        {!companyId ? (
          <p className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
            Connectez-vous avec une société active pour utiliser SerrAI.
          </p>
        ) : null}

        {error ? (
          <div
            className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-900"
            data-testid="serrai-error"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {(activeConversation?.messages.length ?? 0) === 0 && !streaming && (
          <motion.div className="flex flex-col items-center gap-3 py-8 text-center">
            <motion.div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-slate-900 text-white">
              <Bot className="h-7 w-7" />
            </motion.div>
            <p className="max-w-sm text-[14px] text-slate-600">
              Je peux lire et modifier vos interventions, clients, devis et planning — toujours avec
              votre confirmation pour les changements.
            </p>
            <motion.div className="mt-2 flex flex-wrap justify-center gap-2">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={!companyId || streaming}
                  onClick={() => void sendMessage(q)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}

        {activeConversation?.messages.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} />
        ))}

        {streaming && streamingText ? <Bubble role="assistant" content={streamingText} /> : null}
        {streaming && !streamingText ? (
          <motion.div
            className="flex items-center gap-2 text-[12px] text-slate-500"
            data-testid="serrai-typing"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            SerrAI réfléchit…
          </motion.div>
        ) : null}

        <div ref={bottomRef} />
      </motion.div>

      <AnimatePresence>
        {pendingTool ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="shrink-0 border-t border-amber-200 bg-amber-50 px-4 py-3"
            data-testid="serrai-pending-tool"
          >
            <p className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-amber-900">
              <ShieldCheck className="h-4 w-4" />
              Confirmation requise
            </p>
            <p className="mb-3 text-[13px] text-amber-950">{pendingTool.summary}</p>
            <motion.div className="flex gap-2">
              <button
                type="button"
                data-testid="serrai-confirm-tool"
                onClick={() => void confirmPendingTool()}
                className="flex-1 rounded-[12px] bg-amber-700 py-2 text-[13px] font-bold text-white hover:bg-amber-800"
              >
                Confirmer
              </button>
              <button
                type="button"
                data-testid="serrai-cancel-tool"
                onClick={cancelPendingTool}
                className="rounded-[12px] border border-amber-300 bg-white px-4 py-2 text-[13px] font-semibold text-amber-900"
              >
                Annuler
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
        <motion.div className="flex items-end gap-2 rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15">
          <textarea
            ref={inputRef}
            data-testid="serrai-input"
            value={input}
            disabled={!companyId || streaming || Boolean(pendingTool)}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Demandez à SerrAI…"
            className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            data-testid="serrai-send"
            disabled={!input.trim() || !companyId || streaming || Boolean(pendingTool)}
            onClick={handleSend}
            className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-30"
          >
            {streaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </motion.div>
        <p className="mt-1.5 text-center text-[10px] text-slate-400">
          RGPD · confirmations obligatoires avant modification
        </p>
      </motion.div>
    </motion.div>
  );
}
