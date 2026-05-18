"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Loader2, MessageSquarePlus, ShieldCheck, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import { openInterventionFromChatbot } from "@/features/chatbot/chatbot-navigation";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import ChatbotGalaxyOrb from "@/features/chatbot/components/ChatbotGalaxyOrb";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

const QUICK_PROMPTS = [
  "Briefing du jour",
  "Interventions urgentes non assignées",
  "Dossiers terminés non payés",
  "Résumé clients actifs",
  "Stock en alerte",
];

function renderMarkdownLite(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const isLast = i === lines.length - 1;
    const br = !isLast ? <br /> : null;

    if (/^#{1,3} /.test(line)) {
      const content = line.replace(/^#+\s/, "");
      return (
        <span key={i} className="block font-bold text-[15px] mt-2 mb-0.5">
          {renderInline(content)}
          {br}
        </span>
      );
    }
    if (/^[-*] /.test(line)) {
      return (
        <span key={i} className="block pl-3 before:content-['•'] before:mr-1.5 before:text-slate-400">
          {renderInline(line.slice(2))}
          {br}
        </span>
      );
    }
    return (
      <span key={i}>
        {renderInline(line)}
        {br}
      </span>
    );
  });
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function extractOpenInterventionIds(text: string): string[] {
  const ids = new Set<string>();
  const re = /\(ouvrir:([a-zA-Z0-9_-]+)\)/g;
  let match = re.exec(text);
  while (match) {
    ids.add(match[1]);
    match = re.exec(text);
  }
  return [...ids];
}

function stripOpenMarkers(text: string): string {
  return text.replace(/\(ouvrir:[a-zA-Z0-9_-]+\)/g, "").trim();
}

function Bubble({
  role,
  content,
  onOpenIntervention,
}: {
  role: "user" | "assistant";
  content: string;
  onOpenIntervention?: (id: string) => void;
}) {
  const isUser = role === "user";
  const openIds = !isUser ? extractOpenInterventionIds(content) : [];
  const displayText = isUser ? content : stripOpenMarkers(content);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}
      data-testid={isUser ? "chatbot-bubble-user" : "chatbot-bubble-assistant"}
    >
      {!isUser && <ChatbotGalaxyOrb className="mt-0.5" />}
      <motion.div
        className={cn(
          "max-w-[88%] whitespace-pre-wrap rounded-[18px] px-4 py-3 text-[14px] leading-relaxed",
          isUser
            ? "rounded-br-[6px] bg-slate-900 text-white"
            : "rounded-bl-[6px] border border-slate-100 bg-white text-slate-900 shadow-sm",
        )}
      >
        {isUser ? displayText : renderMarkdownLite(displayText)}
        {openIds.length > 0 && onOpenIntervention ? (
          <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-100 pt-2">
            {openIds.map((id) => (
              <button
                key={id}
                type="button"
                data-testid={`chatbot-open-intervention-${id}`}
                onClick={() => onOpenIntervention(id)}
                className="rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-indigo-700"
              >
                Ouvrir {id.slice(0, 12)}
                {id.length > 12 ? "…" : ""}
              </button>
            ))}
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

export default function ChatbotChat({ className }: { className?: string }) {
  const pager = useDashboardPagerOptional();
  const inboxIntent = useBackofficeInboxIntentOptional();
  const openIntervention = (id: string) =>
    openInterventionFromChatbot(pager, inboxIntent?.setPendingInboxId, id);

  const {
    companyId,
    companyName,
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    newConversation,
    sendMessage,
    streaming,
    streamingText,
    activeTool,
    pendingTool,
    confirmPendingTool,
    cancelPendingTool,
    error,
  } = useChatbotContext();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [activeConversation?.messages, streamingText, pendingTool]);

  return (
    <motion.div
      data-testid="chatbot-chat"
      style={outfit}
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f9fc]", className)}
    >
      <motion.div className="flex shrink-0 items-center justify-end gap-2 border-b border-slate-200/80 bg-white px-4 py-3">
        {/* Header texte supprimé selon la demande */}
        <button
          type="button"
          data-testid="chatbot-new-conversation"
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
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
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
          "flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 pb-6",
        )}
      >
        {!companyId ? (
          <p className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
            Connectez-vous avec une société active pour utiliser le Chatbot.
          </p>
        ) : null}

        {error ? (
          <div
            className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-900"
            data-testid="chatbot-error"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {(activeConversation?.messages.length ?? 0) === 0 && !streaming && (
          <motion.div className="flex flex-col items-center gap-3 py-8 text-center">
            <ChatbotGalaxyOrb />
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
          <Bubble
            key={m.id}
            role={m.role}
            content={m.content}
            onOpenIntervention={m.role === "assistant" ? openIntervention : undefined}
          />
        ))}

        {streaming && streamingText ? (
          <Bubble role="assistant" content={streamingText} onOpenIntervention={openIntervention} />
        ) : null}

        <AnimatePresence>
          {streaming && activeTool ? (
            <motion.div
              key="tool-chip"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="flex items-center gap-2 self-start rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[12px] font-semibold text-indigo-700"
              data-testid="chatbot-tool-chip"
            >
              <Wrench className="h-3.5 w-3.5 animate-pulse" />
              {activeTool.label}…
            </motion.div>
          ) : null}
        </AnimatePresence>

        {streaming && !streamingText && !activeTool ? (
          <motion.div className="flex items-center gap-2 text-[12px] text-slate-500" data-testid="chatbot-typing">
            <Loader2 className="h-4 w-4 animate-spin" />
            Le Chatbot réfléchit…
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
            data-testid="chatbot-pending-tool"
          >
            <p className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-amber-900">
              <ShieldCheck className="h-4 w-4" />
              Confirmation requise
            </p>
            <p className="mb-3 text-[13px] text-amber-950">{pendingTool.summary}</p>
            <motion.div className="flex gap-2">
              <button
                type="button"
                data-testid="chatbot-confirm-tool"
                onClick={() => void confirmPendingTool()}
                className="flex-1 rounded-[12px] bg-amber-700 py-2 text-[13px] font-bold text-white hover:bg-amber-800"
              >
                Confirmer
              </button>
              <button
                type="button"
                data-testid="chatbot-cancel-tool"
                onClick={cancelPendingTool}
                className="rounded-[12px] border border-amber-300 bg-white px-4 py-2 text-[13px] font-semibold text-amber-900"
              >
                Annuler
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
