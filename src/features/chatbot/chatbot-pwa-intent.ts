import type { WorkspaceCopilotSnapshot } from "@/features/copilot/types";
import type { ParsedBillingLineDraft } from "@/features/chatbot/chatbot-billing-parse";
import {
  isBillingLinesAddRequest,
  isImperativeBillingRequest,
  parseBillingLineDrafts,
} from "@/features/chatbot/chatbot-billing-parse";
import {
  type ChatbotBillingResolveContext,
  resolveInterventionForBilling,
} from "@/features/chatbot/chatbot-billing-resolve";
import type { ChatbotDocumentKind } from "@/features/chatbot/chatbot-document";

export type { ChatbotBillingResolveContext };

export type ChatbotPwaResolvedIntervention = {
  interventionId: string;
  clientName: string | null;
};

export type ChatbotPwaIntent =
  | {
      kind: "billing_add_lines";
      intervention: ChatbotPwaResolvedIntervention;
      lines: ParsedBillingLineDraft[];
      previewDocumentType: "quote" | "invoice";
    }
  | {
      kind: "billing_patch";
      intervention: ChatbotPwaResolvedIntervention;
      unitPriceEur: number;
      lineIndex: number;
      description?: string;
      previewDocumentType: "quote" | "invoice";
    }
  | {
      kind: "document_preview";
      intervention: ChatbotPwaResolvedIntervention;
      documentType: ChatbotDocumentKind;
    };

function normalizeMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extrait un montant en euros depuis le message (ex. 500 €, 500,50 euros). */
export function parseChatbotEuroAmount(text: string): number | null {
  const m = text.match(/(\d{1,7}(?:[.,]\d{1,2})?)\s*(?:€|eur(?:os?)?\b)/i);
  if (m) {
    const n = Number(m[1].replace(",", "."));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
  }
  const m2 = text.match(
    /(?:à|a|pour|prix|montant|total)\s*(\d{1,7}(?:[.,]\d{1,2})?)/i,
  );
  if (m2) {
    const n = Number(m2[1].replace(",", "."));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
  }
  return null;
}

/** Nom client / société cité dans la phrase (Vatsaev, Dupont, etc.). */
export function extractChatbotClientQuery(text: string): string | null {
  const patterns = [
    /(?:monsieur|madame|m\.|mme|mr|mrs)\s+([a-zàâäéèêëïîôùûüç][\wàâäéèêëïîôùûüç\-']{1,40})/i,
    /(?:facture|devis|dossier|client|pour)\s+(?:de\s+|du\s+|d[''])?([a-zàâäéèêëïîôùûüç][\wàâäéèêëïîôùûüç\-']{2,40})/i,
    /\b([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ][a-zàâäéèêëïîôùûüç\-']{2,40})\b/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const q = m[1].trim();
      if (q.length >= 2 && !/^(facture|devis|prix|euro|lecot|oui|non)$/i.test(q)) {
        return q;
      }
    }
  }
  return null;
}

export function matchInterventionInSnapshot(
  snapshot: WorkspaceCopilotSnapshot | null | undefined,
  clientQuery: string,
): ChatbotPwaResolvedIntervention | null {
  if (!snapshot?.interventions?.length || !clientQuery.trim()) return null;

  const q = normalizeMatch(clientQuery);
  if (q.length < 2) return null;

  let best: { iv: (typeof snapshot.interventions)[0]; score: number } | null = null;

  for (const iv of snapshot.interventions) {
    const name = normalizeMatch(iv.clientName ?? "");
    if (!name) continue;

    let score = 0;
    if (name === q) score = 100;
    else if (name.includes(q) || q.includes(name)) score = 85;
    else {
      for (const part of q.split(/\s+/).filter((p) => p.length >= 2)) {
        if (name.includes(part)) score += 35;
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { iv, score };
    }
  }

  if (!best || best.score < 35) return null;

  return {
    interventionId: best.iv.id,
    clientName: best.iv.clientName,
  };
}

function wantsDocumentPreview(
  text: string,
  ctx?: ChatbotBillingResolveContext,
): boolean {
  const t = text.toLowerCase();
  if (!/(?:affiche|montre|voir|ouvr|afficher|pdf)/i.test(t)) return false;
  if (parseChatbotEuroAmount(text) != null || parseBillingLineDrafts(text).length > 0) {
    return false;
  }
  if (/facture|devis|rapport|bon/i.test(t)) return true;
  const focusId = (ctx?.focusInterventionId ?? "").trim();
  return Boolean(focusId && /\bpdf\b/i.test(t));
}

function documentTypeFromText(text: string): ChatbotDocumentKind {
  return /\bdevis\b/i.test(text) ? "quote" : "invoice";
}

function lineIndexFromText(text: string): number {
  const m = text.match(/ligne\s*(\d+)/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n >= 1) return n - 1;
  }
  return 0;
}

function previewDocumentTypeFromText(text: string): "quote" | "invoice" {
  return /\bdevis\b/i.test(text) ? "quote" : "invoice";
}

/**
 * Résolution locale (snapshot PWA) — exécution directe, zéro OpenAI si match clair.
 */
export function resolveChatbotPwaIntent(
  text: string,
  snapshot: WorkspaceCopilotSnapshot | null | undefined,
  ctx?: ChatbotBillingResolveContext,
): ChatbotPwaIntent | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const intervention = resolveInterventionForBilling(trimmed, snapshot, ctx);
  if (!intervention) return null;

  const previewDocumentType = previewDocumentTypeFromText(trimmed);
  const lineDrafts = parseBillingLineDrafts(trimmed);

  if (isBillingLinesAddRequest(trimmed)) {
    return {
      kind: "billing_add_lines",
      intervention,
      lines: lineDrafts,
      previewDocumentType,
    };
  }

  if (wantsDocumentPreview(trimmed, ctx)) {
    return {
      kind: "document_preview",
      intervention,
      documentType: documentTypeFromText(trimmed),
    };
  }

  const unitPriceEur = parseChatbotEuroAmount(trimmed);
  if (
    unitPriceEur != null &&
    (/facture|devis|prix|montant|€|eur\b|euro/i.test(trimmed) ||
      isImperativeBillingRequest(trimmed))
  ) {
    const drafts = parseBillingLineDrafts(trimmed);
    const description = drafts.length === 1 ? drafts[0].description : undefined;
    return {
      kind: "billing_patch",
      intervention,
      unitPriceEur,
      lineIndex: lineIndexFromText(trimmed),
      description,
      previewDocumentType,
    };
  }

  return null;
}

export function isChatbotPwaPendingToolId(toolUseId: string): boolean {
  return toolUseId.startsWith("pwa_");
}

export function buildChatbotPwaDoneMessage(intent: ChatbotPwaIntent): string {
  if (intent.kind === "billing_add_lines") {
    const total = intent.lines.reduce((s, l) => s + l.unitPriceEur * l.quantity, 0);
    const list = intent.lines
      .map((l) => `**${l.description}** ${l.unitPriceEur} €`)
      .join(", ");
    const name = intent.intervention.clientName;
    return `Lignes ajoutées (${list}) — total ajouté ${Math.round(total * 100) / 100} €${name ? ` pour **${name}**` : ""}. PDF à droite.`;
  }
  if (intent.kind === "billing_patch") {
    const name = intent.intervention.clientName ?? "le dossier";
    return `Facture mise à jour pour **${name}** à **${intent.unitPriceEur} €**. PDF à droite.`;
  }
  const label = intent.documentType === "quote" ? "Devis" : "Facture";
  const name = intent.intervention.clientName ?? "le client";
  return `${label} de **${name}** affiché à droite.`;
}
