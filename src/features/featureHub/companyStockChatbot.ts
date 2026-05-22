import { AI_ASSISTANT_SLOT_INDEX } from "@/features/ai/aiAssistantConstants";
import type { DashboardPagerApi } from "@/features/dashboard/dashboardPagerContext";

export function dispatchChatbotDraftPrompt(text: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("chatbot-draft-prompt", { detail: { text: text.trim() } }),
  );
}

export function dispatchChatbotQuickPrompt(text: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("chatbot-quick-prompt", { detail: { text: text.trim() } }),
  );
}

export function navigateToChatbotWithPrompt(
  pager: DashboardPagerApi | null | undefined,
  prompt: string,
  mode: "draft" | "send" = "draft",
): void {
  pager?.setPageIndex(AI_ASSISTANT_SLOT_INDEX);
  if (mode === "send") dispatchChatbotQuickPrompt(prompt);
  else dispatchChatbotDraftPrompt(prompt);
}
