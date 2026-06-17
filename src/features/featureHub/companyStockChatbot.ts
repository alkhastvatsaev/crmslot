import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import type { DashboardPagerApi } from "@/features/dashboard/dashboardPagerContext";

/** @deprecated Alias — préférer `dispatchMaterialAgentDraftPrompt`. */
export function dispatchChatbotDraftPrompt(text: string): void {
  dispatchMaterialAgentDraftPrompt(text);
}

/** @deprecated Alias — préférer `dispatchMaterialAgentQuickPrompt`. */
export function dispatchChatbotQuickPrompt(text: string): void {
  dispatchMaterialAgentQuickPrompt(text);
}

export function dispatchMaterialAgentDraftPrompt(text: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("material-agent-draft-prompt", { detail: { text: text.trim() } })
  );
}

/** Sur mobile hub, bascule vers le rail agent matériel (panneau gauche). */
export function focusMaterialAgentMobileRail(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("material-agent-focus-left-rail"));
}

export function dispatchMaterialAgentQuickPrompt(text: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("material-agent-quick-prompt", { detail: { text: text.trim() } })
  );
  focusMaterialAgentMobileRail();
}

export function dispatchBillingAgentDraftPrompt(text: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("billing-agent-draft-prompt", { detail: { text: text.trim() } })
  );
}

export function dispatchBillingAgentQuickPrompt(text: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("billing-agent-quick-prompt", { detail: { text: text.trim() } })
  );
}

/** Ouvre la page Matériel et préremplit / envoie un message à l’agent matériel. */
export function navigateToChatbotWithPrompt(
  pager: DashboardPagerApi | null | undefined,
  prompt: string,
  mode: "draft" | "send" = "draft"
): void {
  pager?.setPageIndex(FEATURE_HUB_SLOT_INDEX);
  if (mode === "send") dispatchMaterialAgentQuickPrompt(prompt);
  else dispatchMaterialAgentDraftPrompt(prompt);
}

/** Ouvre la page Facturation et préremplit / envoie un message à l’agent facturation. */
export function navigateToBillingAgentWithPrompt(
  pager: DashboardPagerApi | null | undefined,
  prompt: string,
  mode: "draft" | "send" = "draft"
): void {
  pager?.setPageIndex(BILLING_HUB_SLOT_INDEX);
  if (mode === "send") dispatchBillingAgentQuickPrompt(prompt);
  else dispatchBillingAgentDraftPrompt(prompt);
}
