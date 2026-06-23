import { isChatbotDocumentKind } from "@/features/chatbot/chatbot-document";
import { streamDocumentToolOutcome } from "@/features/chatbot/chatbot-sse";
import { executeChatbotTool } from "@/features/chatbot/chatbot-tool-executor";
import type { CompanyRole } from "@/features/company";

export type ChatbotDocumentActionBody = {
  companyId?: string;
  role?: CompanyRole | null;
  action?: "preview" | "patch" | "replace_billing" | "append_billing" | "save_email";
  email?: string;
  lines?: Array<{
    description?: string;
    unitPriceEur?: number;
    quantity?: number;
  }>;
  interventionId?: string;
  documentType?: string;
  lineIndex?: number;
  unitPriceEur?: number;
  unitPriceCents?: number;
  quantity?: number;
  description?: string;
  clientName?: string;
  billingLines?: unknown[];
  previewDocumentType?: string;
};

export type ChatbotRouteAuth = {
  uid: string;
};

export function resolveDocumentActionTool(
  body: ChatbotDocumentActionBody | null
):
  | { ok: true; toolName: string; toolInput: Record<string, unknown> }
  | { ok: false; status: number; error: string } {
  const companyId = (body?.companyId ?? "").trim();
  const interventionId = (body?.interventionId ?? "").trim();
  const action = body?.action ?? "preview";

  if (!companyId || !interventionId) {
    return { ok: false, status: 400, error: "companyId et interventionId requis" };
  }

  if (action === "preview") {
    const documentType = body?.documentType ?? "invoice";
    if (!isChatbotDocumentKind(documentType)) {
      return { ok: false, status: 400, error: "documentType invalide" };
    }
    return {
      ok: true,
      toolName: "focus_intervention_document",
      toolInput: { interventionId, documentType },
    };
  }

  if (action === "patch") {
    return {
      ok: true,
      toolName: "patch_intervention_billing",
      toolInput: {
        interventionId,
        lineIndex: body?.lineIndex,
        unitPriceEur: body?.unitPriceEur,
        unitPriceCents: body?.unitPriceCents,
        quantity: body?.quantity,
        description: body?.description,
        clientName: body?.clientName,
        previewDocumentType: body?.previewDocumentType ?? "invoice",
        userConfirmed: true,
      },
    };
  }

  if (action === "replace_billing") {
    return {
      ok: true,
      toolName: "update_intervention_billing",
      toolInput: {
        interventionId,
        billingLines: body?.billingLines,
        clientName: body?.clientName,
        previewDocumentType: body?.previewDocumentType ?? "invoice",
        userConfirmed: true,
      },
    };
  }

  if (action === "save_email") {
    const email = String(body?.email ?? "").trim();
    if (!email) {
      return { ok: false, status: 400, error: "email requis" };
    }
    return {
      ok: true,
      toolName: "save_client_email",
      toolInput: { interventionId, email },
    };
  }

  if (action === "append_billing") {
    const lines = Array.isArray(body?.lines) ? body.lines : [];
    if (lines.length === 0) {
      return { ok: false, status: 400, error: "lines requis" };
    }
    return {
      ok: true,
      toolName: "append_intervention_billing_lines",
      toolInput: {
        interventionId,
        lines,
        previewDocumentType: body?.previewDocumentType ?? "invoice",
        userConfirmed: true,
      },
    };
  }

  return { ok: false, status: 400, error: "action invalide" };
}

export async function handleChatbotDocumentActionPost(
  body: ChatbotDocumentActionBody | null,
  auth: ChatbotRouteAuth
): Promise<Response> {
  const resolved = resolveDocumentActionTool(body);
  if (!resolved.ok) {
    return new Response(JSON.stringify({ error: resolved.error }), { status: resolved.status });
  }

  const companyId = (body?.companyId ?? "").trim();
  const toolCtx = {
    companyId,
    actorUid: auth.uid,
    role: body?.role ?? null,
  };

  const result = await executeChatbotTool(resolved.toolName, resolved.toolInput, toolCtx).catch(
    (err: unknown) => ({
      error: err instanceof Error ? err.message : "Erreur",
    })
  );

  return streamDocumentToolOutcome({
    messages: [],
    toolCallId: `pwa_${resolved.toolName}_${Date.now()}`,
    toolName: resolved.toolName,
    result,
  });
}
