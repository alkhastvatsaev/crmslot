"use client";

import { useCallback, useEffect, useRef } from "react";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import ChatbotGalaxyOrb from "@/features/chatbot/components/ChatbotGalaxyOrb";
import { renderChatbotMarkdownLite } from "@/features/chatbot/chatbot-message-markdown";
import ChatbotQuickActions from "@/features/chatbot/components/ChatbotQuickActions";
import type { ChatbotQuickAction } from "@/features/chatbot/chatbot-quick-actions";
import { useCompanyStockAgentBridge } from "@/context/CompanyStockAgentBridgeContext";
import { useCompanyStockIntent } from "@/context/CompanyStockIntentContext";
import type { CompanyStockAgentContext } from "@/features/featureHub/companyStockAgentTypes";
import { useMaterialAgent } from "@/features/featureHub/hooks/useMaterialAgent";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

function suggestionsToActions(suggestions: string[]): ChatbotQuickAction[] {
  return suggestions.map((label, i) => ({
    id: `material-suggestion-${i}`,
    label,
    kind: "send_message",
    payload: label,
    variant: "outline",
  }));
}

type BubbleProps = {
  role: "user" | "assistant";
  text: string;
  suggestions?: string[];
  quickActions?: ChatbotQuickAction[];
  isLatest: boolean;
  onQuickAction: (text: string) => void;
  quickActionsDisabled: boolean;
};

function MaterialAgentBubble({
  role,
  text,
  suggestions,
  quickActions,
  isLatest,
  onQuickAction,
  quickActionsDisabled,
}: BubbleProps) {
  const isUser = role === "user";
  const actions =
    !isUser && isLatest && quickActions?.length
      ? quickActions
      : !isUser && isLatest && suggestions?.length
        ? suggestionsToActions(suggestions)
        : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}
      data-testid={`company-stock-agent-msg-${role}`}
    >
      {!isUser ? <ChatbotGalaxyOrb className="mt-0.5" /> : null}
      <div
        className={cn(
          "max-w-[88%] whitespace-pre-wrap rounded-[18px] px-4 py-3 text-[14px] leading-relaxed",
          isUser
            ? "rounded-br-[6px] bg-slate-900 text-white"
            : "rounded-bl-[6px] border border-slate-100 bg-white text-slate-900 shadow-sm",
        )}
      >
        {isUser ? text : renderChatbotMarkdownLite(text)}
        {actions.length > 0 ? (
          <ChatbotQuickActions
            actions={actions}
            disabled={quickActionsDisabled}
            onSendMessage={onQuickAction}
            data-testid="company-stock-agent-quick-actions"
          />
        ) : null}
      </div>
    </motion.div>
  );
}

type Props = {
  ctx: CompanyStockAgentContext;
  loading?: boolean;
  enabled?: boolean;
  pageActive?: boolean;
};

/** Rail gauche page Matériel — même minimalisme que ChatbotChat (orb vide + bulles). */
export default function CompanyStockAgentPanel({
  ctx,
  loading = false,
  pageActive = true,
  enabled = true,
}: Props) {
  const { t } = useTranslation();
  const { setSearch, setSelectedStockItemId } = useCompanyStockIntent();
  const { registerHandlers } = useCompanyStockAgentBridge();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendMessageRef = useRef<(text: string) => Promise<void>>(async () => {});
  const resetRef = useRef<() => void>(() => {});

  const onAgentAction = useCallback(
    (action: { searchQuery?: string | null; focusStockItemId?: string | null }) => {
      if (action.searchQuery != null) setSearch(action.searchQuery);
      if (action.focusStockItemId) setSelectedStockItemId(action.focusStockItemId);
    },
    [setSearch, setSelectedStockItemId],
  );

  const agent = useMaterialAgent(ctx, {
    enabled: enabled && !loading && pageActive,
    onAction: onAgentAction,
  });

  sendMessageRef.current = agent.sendMessage;
  resetRef.current = agent.resetConversation;

  const bridgeSendMessage = useCallback((text: string) => {
    void sendMessageRef.current(text);
  }, []);

  const bridgeReset = useCallback(() => {
    resetRef.current();
  }, []);

  const isEmpty = agent.messages.length === 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [agent.messages, agent.thinking]);

  useEffect(() => {
    if (!pageActive || loading) {
      registerHandlers(null);
      return () => registerHandlers(null);
    }
    registerHandlers({
      sendMessage: bridgeSendMessage,
      resetConversation: bridgeReset,
      disabled: !agent.enabled || agent.thinking,
    });
    return () => registerHandlers(null);
  }, [
    pageActive,
    loading,
    agent.enabled,
    agent.thinking,
    bridgeSendMessage,
    bridgeReset,
    registerHandlers,
  ]);

  if (loading) {
    return (
      <div
        data-testid="company-stock-agent-panel"
        className="flex min-h-0 flex-1 items-center justify-center bg-white"
        style={outfit}
      >
        <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <motion.div
      data-testid="company-stock-agent-panel"
      style={outfit}
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
    >
      <div
        ref={scrollRef}
        data-testid="company-stock-agent-messages"
        className={cn(
          GLASS_PANEL_BODY_SCROLL_COMPACT,
          "custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 pb-6",
        )}
      >
        <AnimatePresence>
          {isEmpty && !agent.thinking ? (
            <motion.div
              key="material-agent-empty-orb"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
            >
              <ChatbotGalaxyOrb className="scale-[2]" />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {agent.messages.map((m, index) => (
          <MaterialAgentBubble
            key={m.id}
            role={m.role}
            text={m.text}
            suggestions={m.suggestions}
            quickActions={m.quickActions}
            isLatest={index === agent.messages.length - 1 && !agent.thinking}
            onQuickAction={(text) => void agent.sendMessage(text)}
            quickActionsDisabled={!agent.enabled || agent.thinking}
          />
        ))}

        {agent.thinking ? (
          <motion.div
            className="flex items-center gap-2 text-[12px] text-slate-500"
            data-testid="company-stock-agent-typing"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t("companyStock.agent_thinking")}
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
}
