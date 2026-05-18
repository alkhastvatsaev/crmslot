"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import DashboardTriplePanelLayout from "@/features/dashboard/components/DashboardTriplePanelLayout";
import ChatbotChat from "@/features/chatbot/components/ChatbotChat";
import ChatbotContextRail from "@/features/chatbot/components/ChatbotContextRail";
import { useWorkspaceCopilotSnapshot } from "@/features/copilot/hooks/useWorkspaceCopilotSnapshot";
import { buildChatbotSuggestions } from "@/features/chatbot/buildChatbotSuggestions";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { AI_ASSISTANT_SLOT_INDEX } from "@/features/ai/aiAssistantConstants";

type Props = { slotIndex?: number };

/** Page 5 carrousel — Chatbot (OpenAI + tools + snapshot PWA). */
export default function ChatbotPage({ slotIndex = AI_ASSISTANT_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { snapshot } = useWorkspaceCopilotSnapshot();
  const suggestions = useMemo(() => buildChatbotSuggestions(snapshot), [snapshot]);

  return (
    <DashboardTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`Page ${humanPage} — suggestions Chatbot`}
      centerAriaLabel={`Page ${humanPage} — Chatbot`}
      rightAriaLabel={`Page ${humanPage} — KPI Chatbot`}
      centerPadding={false}
      left={
        <div
          className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex min-h-0 flex-1 flex-col gap-2 px-1 pb-4`}
          data-testid="chatbot-suggestions-rail"
        >
          <p className="px-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
            Suggestions
          </p>
          {suggestions.map((label) => (
            <button
              key={label}
              type="button"
              className="flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/40"
              data-testid="chatbot-suggestion-chip"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("chatbot-quick-prompt", { detail: { text: label } }),
                );
              }}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
              {label}
            </button>
          ))}
        </div>
      }
      center={<ChatbotChat />}
      right={<ChatbotContextRail />}
    />
  );
}
