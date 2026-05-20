import { executeChatbotTool, type ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import {
  resolveChatbotPwaIntent,
  type ChatbotPwaIntent,
} from "@/features/chatbot/chatbot-pwa-intent";
import type { ChatbotBillingResolveContext } from "@/features/chatbot/chatbot-billing-resolve";
import { streamDocumentToolOutcome } from "@/features/chatbot/chatbot-sse";
import type { WorkspaceCopilotSnapshot } from "@/features/copilot/types";

function pwaIntentToTool(intent: ChatbotPwaIntent): { name: string; input: Record<string, unknown> } {
  const interventionId = intent.intervention.interventionId;
  switch (intent.kind) {
    case "document_preview":
      return {
        name: "focus_intervention_document",
        input: { interventionId, documentType: intent.documentType },
      };
    case "billing_patch":
      return {
        name: "patch_intervention_billing",
        input: {
          interventionId,
          unitPriceEur: intent.unitPriceEur,
          lineIndex: intent.lineIndex,
          description: intent.description,
          previewDocumentType: intent.previewDocumentType,
          userConfirmed: true,
        },
      };
    case "billing_add_lines":
      return {
        name: "append_intervention_billing_lines",
        input: {
          interventionId,
          lines: intent.lines,
          previewDocumentType: intent.previewDocumentType,
          userConfirmed: true,
        },
      };
  }
}

/** Exécution locale (snapshot PWA) — PDF / facture sans OpenAI. */
export async function handleChatbotPwaIntentRoute(params: {
  lastUserText: string;
  messages: unknown[];
  workspaceSnapshot: WorkspaceCopilotSnapshot | null;
  toolCtx: ChatbotToolContext;
  billingCtx?: ChatbotBillingResolveContext;
}): Promise<Response | null> {
  const intent = resolveChatbotPwaIntent(
    params.lastUserText,
    params.workspaceSnapshot,
    params.billingCtx,
  );
  if (!intent) return null;

  const { name, input } = pwaIntentToTool(intent);
  const result = await executeChatbotTool(name, input, params.toolCtx).catch((err: unknown) => ({
    error: err instanceof Error ? err.message : "Erreur",
  }));

  return streamDocumentToolOutcome({
    messages: params.messages,
    toolCallId: `pwa_${name}_${Date.now()}`,
    toolName: name,
    result,
  });
}
