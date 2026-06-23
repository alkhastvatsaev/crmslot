"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import ChatbotGalaxyOrb from "@/features/chatbot/components/ChatbotGalaxyOrb";
import { renderChatbotMarkdownLite } from "@/features/chatbot/chatbot-message-markdown";
import {
  deriveChatbotQuickActions,
  mergeQuickActions,
  type ChatbotQuickAction,
} from "@/features/chatbot/chatbot-quick-actions";
import ChatbotQuickActions from "@/features/chatbot/components/ChatbotQuickActions";

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

export default function ChatbotChatBubble({
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
            suggestionTagsToActions(suggestionTags)
          )
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
            : "rounded-bl-[6px] border border-slate-100 bg-white text-slate-900 shadow-sm"
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
