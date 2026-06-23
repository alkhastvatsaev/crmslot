"use client";

import { useEffect, useRef } from "react";
import { Loader2, ShieldCheck, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import { openInterventionFromChatbot } from "@/features/chatbot/chatbot-navigation";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import ChatbotGalaxyOrb from "@/features/chatbot/components/ChatbotGalaxyOrb";
import ChatbotChatBubble from "@/features/chatbot/components/ChatbotChatBubble";
import { useTranslation } from "@/core/i18n/I18nContext";

export default function ChatbotChat({ className }: { className?: string }) {
  const { t } = useTranslation();
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
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f9fc]", className)}
    >
      <motion.div
        className={cn(
          GLASS_PANEL_BODY_SCROLL_COMPACT,
          "flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 pb-6"
        )}
      >
        {!companyId ? (
          <p className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
            {t("chatbot.no_company")}
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
              <ChatbotGalaxyOrb size="hero" />
            </motion.div>
          )}
        </AnimatePresence>

        {activeConversation?.messages.map((m, index) => (
          <ChatbotChatBubble
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
          <ChatbotChatBubble
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
          <motion.div
            className="flex items-center gap-2 text-[12px] text-slate-500"
            data-testid="chatbot-typing"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("chatbot.thinking")}
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
              {t("chatbot.confirm_required")}
            </p>
            <p className="mb-3 text-[13px] text-amber-950">{pendingTool.summary}</p>
            <p className="mb-3 text-[11px] text-amber-800">{t("chatbot.confirm_hint")}</p>
            <motion.div className="flex gap-2">
              <button
                type="button"
                data-testid="chatbot-confirm-tool"
                onClick={() => void confirmPendingTool()}
                className="flex-1 rounded-[12px] bg-amber-700 py-2 text-[13px] font-bold text-white hover:bg-amber-800"
              >
                {t("chatbot.confirm")}
              </button>
              <button
                type="button"
                data-testid="chatbot-cancel-tool"
                onClick={cancelPendingTool}
                className="rounded-[12px] border border-amber-300 bg-white px-4 py-2 text-[13px] font-semibold text-amber-900"
              >
                {t("common.cancel")}
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
