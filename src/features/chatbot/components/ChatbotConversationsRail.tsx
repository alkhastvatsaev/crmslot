"use client";

import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { useTranslation } from "@/core/i18n/I18nContext";

function formatConversationWhen(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("fr-BE", { day: "numeric", month: "short" });
}

/** Rail gauche page 5 — historique des conversations Chatbot. */
export default function ChatbotConversationsRail() {
  const { t } = useTranslation();
  const { conversations, activeId, setActiveId, newConversation } = useChatbotContext();

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div
      className={cn(
        GLASS_PANEL_BODY_SCROLL_COMPACT,
        "flex min-h-0 flex-1 flex-col gap-2 px-2 pb-4",
      )}
      data-testid="chatbot-conversations-rail"
    >
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          {t("chatbot.history_heading")}
        </p>
        <button
          type="button"
          data-testid="chatbot-new-conversation"
          onClick={newConversation}
          className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          aria-label={String(t("chatbot.new_conversation"))}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          {t("chatbot.new_conversation_short")}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p
          className="px-2 py-6 text-center text-[12px] leading-relaxed text-slate-500"
          data-testid="chatbot-conversations-empty"
        >
          {t("chatbot.conversations_empty")}
        </p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto" role="list">
          {sorted.map((c) => {
            const active = c.id === activeId;
            const preview =
              c.messages[c.messages.length - 1]?.content?.slice(0, 60) ||
              String(t("chatbot.conversation_empty_preview"));
            return (
              <li key={c.id}>
                <button
                  type="button"
                  role="listitem"
                  data-testid={`chatbot-conversation-${c.id}`}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full rounded-[12px] border px-3 py-2.5 text-left transition",
                    active
                      ? "border-indigo-200 bg-indigo-50 shadow-sm"
                      : "border-transparent bg-white/60 hover:border-slate-200 hover:bg-white",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "line-clamp-1 text-[13px] font-semibold",
                        active ? "text-indigo-900" : "text-slate-800",
                      )}
                    >
                      {c.title || String(t("chatbot.conversation_untitled"))}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
                      {formatConversationWhen(c.updatedAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{preview}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
