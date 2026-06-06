"use client";

import { useCallback, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import ChatbotGalaxyOrb from "@/features/chatbot/components/ChatbotGalaxyOrb";
import { renderChatbotMarkdownLite } from "@/features/chatbot/chatbot-message-markdown";
import ChatbotQuickActions from "@/features/chatbot/components/ChatbotQuickActions";
import type { ChatbotQuickAction } from "@/features/chatbot/chatbot-quick-actions";
import type { HubAgentBridgeHandlers, HubAgentMessage } from "@/features/hubAgents/hubAgentTypes";
import type { useHubAgent } from "@/features/hubAgents/useHubAgent";

function suggestionsToActions(suggestions: string[], idPrefix: string): ChatbotQuickAction[] {
  return suggestions.map((label, i) => ({
    id: `${idPrefix}-suggestion-${i}`,
    label,
    kind: "send_message",
    payload: label,
    variant: "outline",
  }));
}

type AgentApi = Pick<
  ReturnType<typeof useHubAgent>,
  "messages" | "thinking" | "sendMessage" | "resetConversation" | "enabled"
>;

type Props = {
  testIdPrefix: string;
  thinkingLabelKey: string;
  agent: AgentApi;
  loading?: boolean;
  pageActive?: boolean;
  enabled?: boolean;
  registerHandlers: (handlers: HubAgentBridgeHandlers | null) => void;
};

function AgentBubble({
  testIdPrefix,
  role,
  text,
  suggestions,
  isLatest,
  onQuickAction,
  quickActionsDisabled,
}: {
  testIdPrefix: string;
  role: "user" | "assistant";
  text: string;
  suggestions?: string[];
  isLatest: boolean;
  onQuickAction: (text: string) => void;
  quickActionsDisabled: boolean;
}) {
  const isUser = role === "user";
  const actions =
    !isUser && isLatest && suggestions?.length
      ? suggestionsToActions(suggestions, testIdPrefix)
      : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}
      data-testid={`${testIdPrefix}-msg-${role}`}
    >
      {!isUser ? <ChatbotGalaxyOrb className="mt-0.5" /> : null}
      <div
        className={cn(
          "max-w-[88%] whitespace-pre-wrap rounded-[18px] px-4 py-3 text-[14px] leading-relaxed",
          isUser
            ? "rounded-br-[6px] bg-slate-900 text-white"
            : "rounded-bl-[6px] border border-slate-100 bg-white text-slate-900 shadow-sm"
        )}
      >
        {isUser ? text : renderChatbotMarkdownLite(text)}
        {actions.length > 0 ? (
          <ChatbotQuickActions
            actions={actions}
            disabled={quickActionsDisabled}
            onSendMessage={onQuickAction}
            data-testid={`${testIdPrefix}-quick-actions`}
          />
        ) : null}
      </div>
    </motion.div>
  );
}

export default function HubAgentPanel({
  testIdPrefix,
  thinkingLabelKey,
  agent,
  loading = false,
  pageActive = true,
  enabled = true,
  registerHandlers,
}: Props) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendMessageRef = useRef<(text: string) => Promise<void>>(async () => {});
  const resetRef = useRef<() => void>(() => {});

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
      disabled: !enabled || !agent.enabled || agent.thinking,
    });
    return () => registerHandlers(null);
  }, [
    pageActive,
    loading,
    enabled,
    agent.enabled,
    agent.thinking,
    bridgeSendMessage,
    bridgeReset,
    registerHandlers,
  ]);

  if (loading) {
    return (
      <div
        data-testid={`${testIdPrefix}-panel`}
        className="flex min-h-0 flex-1 items-center justify-center bg-white"
      >
        <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <motion.div
      data-testid={`${testIdPrefix}-panel`}
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
    >
      <div
        ref={scrollRef}
        data-testid={`${testIdPrefix}-messages`}
        className={cn(
          GLASS_PANEL_BODY_SCROLL_COMPACT,
          "custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 pb-6"
        )}
      >
        <AnimatePresence>
          {isEmpty && !agent.thinking ? (
            <motion.div
              key={`${testIdPrefix}-empty-orb`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
            >
              <ChatbotGalaxyOrb size="hero" />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {agent.messages.map((m: HubAgentMessage, index) => (
          <AgentBubble
            key={m.id}
            testIdPrefix={testIdPrefix}
            role={m.role}
            text={m.text}
            suggestions={m.suggestions}
            isLatest={index === agent.messages.length - 1 && !agent.thinking}
            onQuickAction={(text) => void agent.sendMessage(text)}
            quickActionsDisabled={!agent.enabled || agent.thinking}
          />
        ))}

        {agent.thinking ? (
          <motion.div
            className="flex items-center gap-2 text-[12px] text-slate-500"
            data-testid={`${testIdPrefix}-typing`}
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t(thinkingLabelKey)}
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
}
