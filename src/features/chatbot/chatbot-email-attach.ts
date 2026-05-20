import { parseAttachDocumentType } from "@/core/services/email/interventionEmailAttachOptions";
import type { InterventionEmailPdfKind } from "@/core/services/email/interventionEmailPdfAttachment";

const EXPLICIT_NO_ATTACH_RE =
  /\b(?:sans\s+(?:pj|pi[eè]ce(?:\s+jointe)?)|pas\s+de\s+(?:pj|pi[eè]ce(?:\s+jointe)?)|sans\s+(?:facture|devis|pdf)\s+joint|ne\s+joint\s+pas)\b/i;

/** Déduit facture vs devis vs pas de PJ depuis le texte utilisateur / email. */
export function inferEmailAttachDocumentType(...texts: string[]): InterventionEmailPdfKind | "none" {
  const t = texts
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!t) return "invoice";
  if (EXPLICIT_NO_ATTACH_RE.test(t)) return "none";
  if (/\bdevis\b/.test(t) && !/\bfacture\b/.test(t)) return "quote";
  if (/\b(?:facture|devis|pdf|pi[eè]ce\s+jointe|\bpj\b)\b/i.test(t)) {
    return /\bdevis\b/.test(t) && !/\bfacture\b/.test(t) ? "quote" : "invoice";
  }
  return "invoice";
}

/**
 * Normalise attachDocumentType avant envoi chatbot.
 * Défaut : facture PDF. Le modèle envoie souvent "none" à tort — ignoré sauf refus explicite utilisateur.
 */
export function resolveSendInterventionEmailAttachType(
  input: Record<string, unknown>,
  lastUserText?: string | null,
): InterventionEmailPdfKind | "none" {
  const userHint = lastUserText?.trim() ?? "";
  const subject = String(input.subject ?? "");
  const bodyText = String(input.bodyText ?? "");

  if (userHint && EXPLICIT_NO_ATTACH_RE.test(userHint)) {
    return "none";
  }

  const fromText = inferEmailAttachDocumentType(userHint, subject, bodyText);
  if (fromText === "quote") return "quote";
  if (fromText === "none") return "none";

  const raw = input.attachDocumentType;
  if (raw === "quote" || raw === "invoice") {
    return parseAttachDocumentType(raw);
  }

  return "invoice";
}

export function normalizeSendInterventionEmailArguments(
  args: Record<string, unknown>,
  lastUserText: string | null,
): void {
  args.attachDocumentType = resolveSendInterventionEmailAttachType(args, lastUserText);
}
