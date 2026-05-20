"use client";

import { useEffect, useRef } from "react";
import { Loader2, ShieldCheck, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import { openInterventionFromChatbot } from "@/features/chatbot/chatbot-navigation";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import ChatbotGalaxyOrb from "@/features/chatbot/components/ChatbotGalaxyOrb";
import { renderChatbotMarkdownLite } from "@/features/chatbot/chatbot-message-markdown";
import {
  deriveChatbotQuickActions,
  mergeQuickActions,
  type ChatbotQuickAction,
} from "@/features/chatbot/chatbot-quick-actions";
import ChatbotQuickActions from "@/features/chatbot/components/ChatbotQuickActions";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

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

function extractSuggestions(text: string): string[] {
  const suggestions = new Set<string>();
  const re = /<suggestion>(.*?)<\/suggestion>/gi;
  let match = re.exec(text);
  while (match) {
    suggestions.add(match[1].trim());
    match = re.exec(text);
  }
  return [...suggestions];
}

function stripSuggestions(text: string): string {
  return text.replace(/<suggestion>.*?<\/suggestion>/gi, "").trim();
}

function suggestionTagsToActions(tags: string[]): ChatbotQuickAction[] {
  return tags.map((label, i) => ({
    id: `suggestion-tag-${i}`,
    label,
    kind: "send_message",
    payload: label,
    variant: "outline" as const,
  }));
}

function Bubble({
  role,
  content,
  actions,
  onOpenIntervention,
  onQuickAction,
  quickActionsDisabled,
  isLatest,
}: {
  role: "user" | "assistant";
  content: string;
  actions?: ChatbotQuickAction[];
  onOpenIntervention?: (id: string) => void;
  onQuickAction?: (text: string) => void;
  quickActionsDisabled?: boolean;
  isLatest?: boolean;
}) {
  const isUser = role === "user";
  const openIds = !isUser ? extractOpenInterventionIds(content) : [];
  const suggestionTags = !isUser && isLatest ? extractSuggestions(content) : [];
  let displayText = isUser ? content : stripOpenMarkers(content);
  displayText = isUser ? displayText : stripSuggestions(displayText);

  const quickActions =
    !isUser && isLatest && onQuickAction
      ? mergeQuickActions(
          actions ?? [],
          mergeQuickActions(
            deriveChatbotQuickActions(displayText),
            suggestionTagsToActions(suggestionTags),
          ),
        )
      : [];
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
        {isUser ? displayText : renderChatbotMarkdownLite(displayText)}
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
        {quickActions.length > 0 && onQuickAction ? (
          <ChatbotQuickActions
            actions={quickActions}
            disabled={quickActionsDisabled}
            onSendMessage={onQuickAction}
          />
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
    activeConversation,
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

        <AnimatePresence>
          {(activeConversation?.messages.length ?? 0) === 0 && !streaming && (
            <motion.div
              key="chatbot-empty-orb-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
            >
              <ChatbotGalaxyOrb className="scale-[2]" />
            </motion.div>
          )}
        </AnimatePresence>

        {activeConversation?.messages.map((m, index) => (
          <Bubble
            key={m.id}
            role={m.role}
            content={m.content}
            actions={m.actions}
            onOpenIntervention={m.role === "assistant" ? openIntervention : undefined}
            onQuickAction={(text) => void sendMessage(text)}
            quickActionsDisabled={streaming || Boolean(pendingTool) || !companyId}
            isLatest={
              index === activeConversation.messages.length - 1 && !streaming && !streamingText
            }
          />
        ))}

        {streaming && streamingText ? (
          <Bubble
            role="assistant"
            content={streamingText}
            onOpenIntervention={openIntervention}
            isLatest
          />
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
            <p className="mb-3 text-[11px] text-amber-800">
              Cliquez <strong>Confirmer</strong> ou tapez <strong>oui</strong> dans le champ ci-dessous.
            </p>
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
