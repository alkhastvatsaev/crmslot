export type ParsedBillingLineDraft = {
  description: string;
  unitPriceEur: number;
  quantity: number;
};

const IMPERATIVE_RE =
  /^(?:ajoute[rz]?|rajoute[rz]?|mets?|met(?:tre|s)?|inclu(?:re|s)?|ajout)\b/i;

/** Verbes d'ajout de ligne(s), pas de remplacement du total. */
const ADD_LINES_VERB_RE = /^(?:ajoute[rz]?|rajoute[rz]?|inclu(?:re|s)?|ajout)\b/i;

function cleanDescription(raw: string): string {
  return raw
    .replace(/^(?:ajoute[rz]?|rajoute[rz]?|mets?|met(?:tre|s)?|inclu(?:re|s)?|une?|la|le|les)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSegment(segment: string): ParsedBillingLineDraft | null {
  const seg = segment.trim();
  if (!seg) return null;

  const withA = seg.match(
    /^(.+?)\s+(?:à|a)\s*(\d{1,7}(?:[.,]\d{1,2})?)\s*(?:€|eur(?:os?)?\b)?/i,
  );
  if (withA) {
    const description = cleanDescription(withA[1]);
    const unitPriceEur = Number(withA[2].replace(",", "."));
    if (description.length >= 2 && Number.isFinite(unitPriceEur) && unitPriceEur > 0) {
      return { description, unitPriceEur: Math.round(unitPriceEur * 100) / 100, quantity: 1 };
    }
  }

  const trailingPrice = seg.match(
    /^(.+?)\s+(\d{1,7}(?:[.,]\d{1,2})?)\s*(?:€|eur(?:os?)?\b)?\s*$/i,
  );
  if (trailingPrice) {
    const description = cleanDescription(trailingPrice[1]);
    const unitPriceEur = Number(trailingPrice[2].replace(",", "."));
    if (description.length >= 2 && Number.isFinite(unitPriceEur) && unitPriceEur > 0) {
      return { description, unitPriceEur: Math.round(unitPriceEur * 100) / 100, quantity: 1 };
    }
  }

  return null;
}

/** Découpe « serrure 300 € et main d'œuvre 50 € » en lignes facturation. */
export function parseBillingLineDrafts(text: string): ParsedBillingLineDraft[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const segments = normalized
    .split(/\s+et\s+|,\s+(?=[a-zàâäéèêëïîôùûüç])/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const lines: ParsedBillingLineDraft[] = [];
  for (const seg of segments) {
    const line = parseSegment(seg);
    if (line) lines.push(line);
  }
  return lines;
}

export function isImperativeBillingRequest(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (IMPERATIVE_RE.test(t)) return true;
  return /(?:mets?|chang(?:e|er)|modifier|passer)\s+(?:la\s+)?(?:facture|devis|prix)/i.test(t);
}

/** Ajout de lignes (vs modifier un montant global). */
export function isBillingLinesAddRequest(text: string): boolean {
  const drafts = parseBillingLineDrafts(text);
  if (drafts.length >= 2) return true;
  if (drafts.length === 1 && ADD_LINES_VERB_RE.test(text.trim())) return true;
  return false;
}

export function shouldAutoConfirmChatbotBillingWrite(
  toolName: string,
  lastUserText: string | null,
): boolean {
  if (!lastUserText?.trim()) return false;
  if (
    toolName !== "patch_intervention_billing" &&
    toolName !== "update_intervention_billing"
  ) {
    return false;
  }
  return isImperativeBillingRequest(lastUserText);
}
