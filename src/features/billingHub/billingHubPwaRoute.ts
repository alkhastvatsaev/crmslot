import { getAdminDb } from "@/core/config/firebase-admin";
import { buildWorkspaceCopilotSnapshot } from "@/features/copilot/buildWorkspaceCopilotSnapshot";
import { handleChatbotPwaIntentRoute } from "@/features/chatbot/chatbot-pwa-route";
import { fetchInterventionsForCompany } from "@/features/chatbot/chatbot-intervention-source";
import { lastUserMessageText } from "@/features/chatbot/chatbot-route-handler";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import type { Intervention } from "@/features/interventions/types";

/** Charge les dossiers société pour la résolution locale « facture M. Dupont » (sans OpenAI). */
export async function handleBillingHubPwaIntentRoute(params: {
  messages: unknown[];
  companyId: string;
  companyName: string;
  role: string | null;
  toolCtx: ChatbotToolContext;
  focusInterventionId?: string | null;
}): Promise<Response | null> {
  const lastUserText = (lastUserMessageText(params.messages) ?? "").trim();
  if (!lastUserText) return null;

  const interventionRows = await fetchInterventionsForCompany(getAdminDb(), params.companyId, 120);
  const snapshot = buildWorkspaceCopilotSnapshot({
    locale: "fr",
    companyId: params.companyId,
    companyName: params.companyName,
    companyRole: params.role,
    interventions: interventionRows as unknown as Intervention[],
    pendingOfflineQueue: 0,
    navigatorOnline: true,
  });

  return handleChatbotPwaIntentRoute({
    lastUserText,
    messages: params.messages,
    workspaceSnapshot: snapshot,
    toolCtx: params.toolCtx,
    billingCtx: {
      focusInterventionId: params.focusInterventionId ?? null,
    },
  });
}
