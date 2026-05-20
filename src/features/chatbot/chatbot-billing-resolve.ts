import type { WorkspaceCopilotSnapshot } from "@/features/copilot/types";
import type { ChatbotPwaResolvedIntervention } from "@/features/chatbot/chatbot-pwa-intent";
import { extractChatbotClientQuery, matchInterventionInSnapshot } from "@/features/chatbot/chatbot-pwa-intent";

export type ChatbotBillingResolveContext = {
  focusInterventionId?: string | null;
};

export function pickDefaultBillingIntervention(
  snapshot: WorkspaceCopilotSnapshot | null | undefined,
): ChatbotPwaResolvedIntervention | null {
  if (!snapshot?.interventions?.length) return null;

  const candidates = snapshot.interventions.filter(
    (iv) =>
      iv.status !== "cancelled" &&
      (iv.status === "in_progress" ||
        iv.status === "done" ||
        iv.status === "invoiced" ||
        iv.paymentStatus === "unpaid" ||
        iv.hasInvoicePdf),
  );

  if (candidates.length === 1) {
    return { interventionId: candidates[0].id, clientName: candidates[0].clientName };
  }

  const unpaid = candidates.filter((iv) => iv.paymentStatus === "unpaid");
  if (unpaid.length === 1) {
    return { interventionId: unpaid[0].id, clientName: unpaid[0].clientName };
  }

  const inProgress = candidates.filter((iv) => iv.status === "in_progress");
  if (inProgress.length === 1) {
    return { interventionId: inProgress[0].id, clientName: inProgress[0].clientName };
  }

  return null;
}

export function resolveInterventionForBilling(
  text: string,
  snapshot: WorkspaceCopilotSnapshot | null | undefined,
  ctx?: ChatbotBillingResolveContext,
): ChatbotPwaResolvedIntervention | null {
  const clientQuery = extractChatbotClientQuery(text);
  if (clientQuery) {
    const byName = matchInterventionInSnapshot(snapshot, clientQuery);
    if (byName) return byName;
  }

  const focusId = (ctx?.focusInterventionId ?? "").trim();
  if (focusId) {
    const iv = snapshot?.interventions.find((i) => i.id === focusId);
    if (iv) {
      return { interventionId: iv.id, clientName: iv.clientName };
    }
    return { interventionId: focusId, clientName: null };
  }

  return pickDefaultBillingIntervention(snapshot);
}

/** Résout le dossier pour enregistrer un email (focus PWA, nom client, ou dossier unique). */
export function resolveInterventionForClientEmail(
  text: string,
  snapshot: WorkspaceCopilotSnapshot | null | undefined,
  ctx?: ChatbotBillingResolveContext,
): ChatbotPwaResolvedIntervention | null {
  const fromText = resolveInterventionForBilling(text, snapshot, ctx);
  if (fromText) return fromText;
  return pickDefaultBillingIntervention(snapshot);
}
