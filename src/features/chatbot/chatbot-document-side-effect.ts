import type { ChatbotDocumentKind } from "@/features/chatbot/chatbot-document";
import { HUB_AGENT_IMMEDIATE_UI_TOOLS } from "@/features/hubAgents/hubAgentToolScopes";

/** Écriture facturation uniquement — pas de PDF côté IA. */
export const CHATBOT_BILLING_WRITE_TOOLS = new Set([
  "patch_intervention_billing",
  "update_intervention_billing",
  "append_intervention_billing_lines",
]);

/** Signal UI : la PWA charge le PDF via /api/interventions/.../document-pdf (jsPDF). */
export const CHATBOT_PWA_DOCUMENT_FOCUS_TOOLS = new Set(["focus_intervention_document"]);

export const CHATBOT_EXPORT_UI_TOOLS = new Set([
  "trigger_accounting_export",
  "trigger_payroll_export",
]);

/** Après ces outils : SSE document_preview + fin de tour OpenAI (réponse minimale). */
export const CHATBOT_ZERO_TOKEN_UI_TOOLS = new Set([
  ...CHATBOT_BILLING_WRITE_TOOLS,
  ...CHATBOT_PWA_DOCUMENT_FOCUS_TOOLS,
  ...CHATBOT_EXPORT_UI_TOOLS,
  ...HUB_AGENT_IMMEDIATE_UI_TOOLS,
]);

/** @deprecated Alias — préférer isChatbotZeroTokenUiTool */
export function isChatbotDocumentSideEffectTool(name: string): boolean {
  return CHATBOT_ZERO_TOKEN_UI_TOOLS.has(name);
}

export function isChatbotZeroTokenUiTool(name: string): boolean {
  return CHATBOT_ZERO_TOKEN_UI_TOOLS.has(name);
}

export function isChatbotBillingWriteTool(name: string): boolean {
  return CHATBOT_BILLING_WRITE_TOOLS.has(name);
}

export type DocumentPreviewPayload = {
  interventionId: string;
  documentType: ChatbotDocumentKind;
};

export function extractDocumentPreviewFromResult(result: unknown): DocumentPreviewPayload | null {
  if (!result || typeof result !== "object" || !(result as { ok?: boolean }).ok) return null;
  const r = result as {
    interventionId?: string;
    documentType?: string;
    previewDocumentType?: string;
  };
  const raw = r.documentType || r.previewDocumentType;
  if (
    !r.interventionId ||
    (raw !== "quote" && raw !== "invoice" && raw !== "report" && raw !== "material_order")
  ) {
    return null;
  }
  return { interventionId: r.interventionId, documentType: raw };
}

/** Réponse minimale au modèle — jamais de contenu PDF. */
export const MINIMAL_DOCUMENT_TOOL_RESULT_JSON = '{"ok":true,"ui":"pwa"}';

export function documentToolSuccessMessage(toolName: string, result: unknown): string {
  if (result && typeof result === "object" && "error" in (result as object)) {
    return String((result as { error?: string }).error ?? "Erreur.");
  }

  if (toolName === "order_lecot_parts" && result && typeof result === "object") {
    const o = result as {
      supplierOrderId?: string;
      clientName?: string | null;
      totalEur?: number;
      demoMode?: boolean;
      demoReference?: string;
      billingSynced?: boolean;
      interventionId?: string | null;
    };
    if (o.supplierOrderId) {
      const total = typeof o.totalEur === "number" ? ` (${o.totalEur} € HT)` : "";
      const client =
        typeof o.clientName === "string" && o.clientName.trim()
          ? ` Client : ${o.clientName.trim()}.`
          : "";
      const synced = o.billingSynced
        ? " Facture dossier mise à jour ; PDF bon de commande et facture à droite."
        : " Voir onglets Commandes et Bon de commande à droite.";
      if (o.demoMode) {
        const ref = o.demoReference ?? o.supplierOrderId;
        return `Commande Lecot simulée (démo)${total} — ${ref}.${client}${synced} Enregistrée dans la PWA.`;
      }
      return `Commande Lecot enregistrée${total} — réf. ${o.supplierOrderId.slice(0, 10)}….${client}${synced}`;
    }
  }

  if (!result || typeof result !== "object" || !(result as { ok?: boolean }).ok) {
    return "Action impossible.";
  }
  const r = result as { clientName?: string; totalEur?: number };

  if (toolName === "send_gmail_reply") {
    const r = result as { sentTo?: string; subject?: string };
    const to = r.sentTo ?? "destinataire";
    const subject = String(r.subject ?? "").trim();
    return subject
      ? `✅ Réponse Gmail envoyée à **${to}**. Objet : « ${subject.slice(0, 60)} ».`
      : `✅ Réponse Gmail envoyée à **${to}**.`;
  }

  if (toolName === "link_gmail_to_intervention") {
    const r = result as { interventionId?: string; subject?: string; from?: string };
    const id = r.interventionId ?? "dossier";
    const subject = String(r.subject ?? "").slice(0, 50);
    return `✅ Mail lié au dossier **${id}**${subject ? ` — « ${subject} »` : ""}${r.from ? ` (${r.from})` : ""}.`;
  }

  if (toolName === "send_intervention_email") {
    const r = result as {
      to?: string;
      subject?: string;
      attachmentFilename?: string | null;
      attachDocumentType?: string;
    };
    const to = r.to ?? "destinataire";
    const subject = String(r.subject ?? "").trim();
    const wantedPdf = r.attachDocumentType && r.attachDocumentType !== "none";
    const attach = r.attachmentFilename
      ? ` (pièce jointe : ${r.attachmentFilename})`
      : wantedPdf
        ? " — ⚠️ PDF non joint (vérifiez la facturation du dossier)."
        : "";
    return subject
      ? `✅ Email envoyé à **${to}**${attach}. Objet : « ${subject.slice(0, 60)} ».`
      : `✅ Email envoyé à **${to}**${attach}.`;
  }

  if (toolName === "save_client_email") {
    const r = result as {
      email?: string;
      clientName?: string;
      savedOnClient?: boolean;
      savedOnIntervention?: boolean;
    };
    if (!r.savedOnIntervention && !r.savedOnClient) {
      return `Email déjà enregistré : ${r.email ?? ""}.`;
    }
    const where = r.savedOnClient ? "dossier et fiche CRM" : "dossier";
    const who = r.clientName ? ` pour ${r.clientName}` : "";
    return `Email ${r.email ?? ""} enregistré sur le ${where}${who}. Les prochains envois pourront le réutiliser.`;
  }

  if (CHATBOT_EXPORT_UI_TOOLS.has(toolName)) {
    return toolName === "trigger_accounting_export"
      ? "✅ Export comptable CSV téléchargé."
      : "✅ Feuilles de temps CSV téléchargées.";
  }

  if (CHATBOT_PWA_DOCUMENT_FOCUS_TOOLS.has(toolName)) {
    return "La PWA affiche le document à droite.";
  }

  const parts = ["Facturation enregistrée. La PWA génère le PDF à droite."];
  if (r.clientName) parts.push(`Client : ${r.clientName}.`);
  if (typeof r.totalEur === "number") parts.push(`Total : ${r.totalEur} €.`);
  return parts.join(" ");
}
