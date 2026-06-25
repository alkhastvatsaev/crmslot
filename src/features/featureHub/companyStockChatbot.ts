import { CRMSLOT_FOCUS_STOCK_HUB_EVENT } from "@/context/CompanyStockIntentContext";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import type { DashboardPagerApi } from "@/features/dashboard";

/** Signal : une commande matériel attend que le bridge agent soit prêt (après changement de page). */
export const MATERIAL_AGENT_PENDING_QUICK_PROMPT_EVENT = "material-agent-pending-quick-prompt";

let pendingMaterialAgentQuickPrompt: string | null = null;

export function peekPendingMaterialAgentQuickPrompt(): string | null {
  return pendingMaterialAgentQuickPrompt;
}

export function consumePendingMaterialAgentQuickPrompt(): string | null {
  const text = pendingMaterialAgentQuickPrompt;
  pendingMaterialAgentQuickPrompt = null;
  return text;
}

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
  focusMaterialAgentMobileRail();
}

/** Sur mobile hub, bascule vers le rail agent matériel (panneau gauche). */
export function focusMaterialAgentMobileRail(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("material-agent-focus-left-rail"));
}

/** Envoi immédiat — l’agent matériel doit déjà être monté (page Matériel active). */
export function dispatchMaterialAgentQuickPrompt(text: string): void {
  if (typeof window === "undefined") return;
  const trimmed = text.trim();
  if (!trimmed) return;
  window.dispatchEvent(
    new CustomEvent("material-agent-quick-prompt", { detail: { text: trimmed } })
  );
  focusMaterialAgentMobileRail();
}

/**
 * Même format que le modal stock central : Commander N× "desc" (réf. X) — société : Y
 * Déclenche skipLecotChainGuard côté agent matériel.
 */
export function buildStockCenterMaterialOrderPrompt(params: {
  quantity: number;
  description: string;
  reference?: string | null;
  companyName?: string | null;
}): string {
  const parts = [
    `Commander ${params.quantity}×`,
    `"${params.description}"`,
    params.reference?.trim() ? `(réf. ${params.reference.trim()})` : null,
    params.companyName?.trim() ? `— société : ${params.companyName.trim()}` : null,
  ].filter(Boolean);
  return parts.join(" ");
}

/**
 * Navigue vers Matériel si besoin, puis envoie le message à l’agent dès que le bridge est prêt.
 * Évite la course au montage (prompt perdu si dispatch avant CompanyStockGalaxyComposer).
 */
export function navigateMaterialAgentWithQuickPrompt(
  pager: DashboardPagerApi | null | undefined,
  prompt: string,
  options?: { stockItemId?: string | null }
): void {
  if (typeof window === "undefined") return;
  const trimmed = prompt.trim();
  if (!trimmed) return;

  if (options?.stockItemId) {
    window.dispatchEvent(
      new CustomEvent(CRMSLOT_FOCUS_STOCK_HUB_EVENT, {
        detail: { stockItemId: options.stockItemId },
      })
    );
  }

  const onMaterialPage = pager?.pageIndex === FEATURE_HUB_SLOT_INDEX;
  if (onMaterialPage) {
    dispatchMaterialAgentQuickPrompt(trimmed);
    return;
  }

  pendingMaterialAgentQuickPrompt = trimmed;
  pager?.setPageIndex(FEATURE_HUB_SLOT_INDEX);
  focusMaterialAgentMobileRail();
  window.dispatchEvent(new CustomEvent(MATERIAL_AGENT_PENDING_QUICK_PROMPT_EVENT));
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
  if (mode === "send") {
    navigateMaterialAgentWithQuickPrompt(pager, prompt);
    return;
  }
  pager?.setPageIndex(FEATURE_HUB_SLOT_INDEX);
  dispatchMaterialAgentDraftPrompt(prompt);
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
