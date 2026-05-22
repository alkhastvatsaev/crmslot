/** Helpers purs (client + serveur) — pas d'import firebase / catalogue serveur. */

import {
  isChatbotEmailIntent,
  isChatbotLecotOrderIntent,
} from "@/features/chatbot/chatbot-email-intent";

export const LECOT_FLOW_CONTEXT_RE =
  /lecot|fournisseur|commande\s+(?:mat|matériel|materiel|lecot|pièce|piece)|catalogue|commander|propose[rz]?|serrure|cylindre|perceuse|verrou|poignée|poignee|gâche|gache|barillet/i;

const LECOT_PRODUCT_PATTERNS: Array<{ re: RegExp; query: string }> = [
  { re: /serrures?/i, query: "serrure" },
  { re: /cylindres?/i, query: "cylindre" },
  { re: /perceuses?/i, query: "perceuse" },
  { re: /verrous?/i, query: "verrou" },
  { re: /poignées?|poignees?/i, query: "poignée" },
  /** Fautes courantes (poignet ≠ poignée mais même intention métier). */
  { re: /poignets?/i, query: "poignée" },
  { re: /gâches?|gaches?/i, query: "gâche" },
  { re: /barillets?/i, query: "cylindre" },
  { re: /visseuses?/i, query: "perceuse" },
];

function normalizeAccentsForLecot(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Orthographe → requête catalogue (mot entier, insensible aux accents). */
const LECOT_PRODUCT_TYPO_ALIASES: Record<string, string> = {
  poignet: "poignée",
  poignets: "poignée",
  serure: "serrure",
  serures: "serrure",
  cylindre: "cylindre",
  percuese: "perceuse",
};

/**
 * Requête catalogue normalisée (mot-clé métier, correction typo légère).
 * Utilisé par l'agent Matériel et search_lecot_products.
 */
export function normalizeLecotProductSearchQuery(text: string): string {
  const t = text.trim();
  if (!t) return t;
  const fromKeyword = extractLecotProductKeyword(t);
  if (fromKeyword) return fromKeyword;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    const key = normalizeAccentsForLecot(words[0].toLowerCase());
    const alias = LECOT_PRODUCT_TYPO_ALIASES[key];
    if (alias) return alias;
  }
  return t;
}

/** Extrait le mot-clé produit d'une phrase (ex. « commander une serrure lecot » → serrure). */
export function extractLecotProductKeyword(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  for (const { re, query } of LECOT_PRODUCT_PATTERNS) {
    if (re.test(t)) return query;
  }
  return null;
}

/** Suite d'un fil « commande Lecot » : l'utilisateur donne enfin le produit (ex. « une serrure »). */
const MAX_LECOT_FOLLOW_UP_CHARS = 400;

export function extractLecotProductQueryFromFollowUp(lastText: string): string | null {
  const t = lastText.trim();
  if (!t || t.length > MAX_LECOT_FOLLOW_UP_CHARS) return null;
  if (isChatbotEmailIntent(t)) return null;
  if (/^commande\s+lecot/i.test(t) || /^lecot\b/i.test(t)) return null;
  const query = t
    .replace(
      /^(?:je\s+veux?|je\s+voudrais|je\s+cherche|j'ai\s+besoin\s+(?:de\s+)?|il\s+me\s+faut|commande[zr]?-?moi|cherche[zr]?)\s+/i,
      "",
    )
    .replace(/^(?:une?|un|des?|la|le|les)\s+/i, "")
    .trim();
  if (query.length < 2) return null;
  if (/^(?:est-ce|avez-vous|pouvez-vous|qu'est-ce)/i.test(query)) return null;
  if (/^(?:oui|yes|ok|non|d'accord)$/i.test(query)) return null;
  return query;
}

export function priorUserTexts(messages: unknown[]): string[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && typeof m === "object" && (m as { role?: string }).role === "user")
    .map((m) => String((m as { content?: unknown }).content ?? "").trim())
    .filter(Boolean)
    .slice(0, -1);
}

const FLOW_HINTS_LECOT_PHRASE =
  /lecot|fournisseur|commande\s+(?:mat|matériel|materiel|lecot|pièce|piece)|catalogue|propose[rz]?\s+(?:\d+\s+)?(?:serrure|cylindre|perceuse)|serrure|cylindre|perceuse|verrou|poignée|poignee|gâche|gache|barillet/i;

export function priorMessagesHaveLecotContext(messages: unknown[]): boolean {
  const prior = priorUserTexts(messages);
  if (prior.some((p) => LECOT_FLOW_CONTEXT_RE.test(p) || isChatbotLecotOrderIntent(p))) {
    return true;
  }
  if (!Array.isArray(messages)) return false;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i] as { role?: string; content?: string };
    if (m.role === "assistant" && typeof m.content === "string") {
      return /catalogue\s+lecot|commande\s+lecot|search_lecot|order_lecot/i.test(m.content);
    }
    if (m.role === "user") break;
  }
  return false;
}

/**
 * Requête catalogue à utiliser pour search_lecot_products / recherche instantanée.
 * Priorité : mot-clé produit dans le message, puis suivi court, puis contexte précédent (oui + serrure avant).
 */
export function resolveLecotCatalogSearchQuery(
  lastUserText: string,
  messages: unknown[],
): string | null {
  const t = lastUserText.trim();
  if (!t) return null;
  if (isChatbotEmailIntent(t) && !isChatbotLecotOrderIntent(t)) return null;

  const fromKeyword = extractLecotProductKeyword(t);
  if (fromKeyword) return normalizeLecotProductSearchQuery(fromKeyword);

  if (/^(?:oui|yes|ok|d'accord|dac)\s*[!.?]*$/i.test(t)) {
    for (const prior of [...priorUserTexts(messages)].reverse()) {
      const kw = extractLecotProductKeyword(prior);
      if (kw) return normalizeLecotProductSearchQuery(kw);
      const fu = extractLecotProductQueryFromFollowUp(prior);
      if (fu) {
        const fromFu = extractLecotProductKeyword(fu) ?? fu;
        return normalizeLecotProductSearchQuery(fromFu);
      }
    }
    return null;
  }

  const fromFollowUp = extractLecotProductQueryFromFollowUp(t);
  if (fromFollowUp) {
    const kw = extractLecotProductKeyword(fromFollowUp);
    if (kw) return normalizeLecotProductSearchQuery(kw);
    const lecotCtx =
      LECOT_FLOW_CONTEXT_RE.test(t) ||
      isChatbotLecotOrderIntent(t) ||
      priorMessagesHaveLecotContext(messages);
    if (lecotCtx && fromFollowUp.length >= 2 && fromFollowUp.length <= 80) {
      return normalizeLecotProductSearchQuery(fromFollowUp);
    }
    return null;
  }

  if (FLOW_HINTS_LECOT_PHRASE.test(t) && t.length <= 280) {
    const stripped = t
      .replace(/^(?:tu\s+peux|peux-tu|pourriez-vous)\s+/i, "")
      .replace(/^(?:commander|commande[zr]?)\s+(?:pour\s+)?/i, "")
      .replace(/\s+sur\s+lecot.*$/i, "")
      .replace(/\s+pour\s+le\s+client\s+[\w\s.-]+/i, " ")
      .replace(/^(?:une?|un|des?|la|le|les)\s+/i, "")
      .trim();
    const kw = extractLecotProductKeyword(stripped);
    if (kw) return kw;
    if (stripped.length >= 2 && stripped.length <= 80) {
      return normalizeLecotProductSearchQuery(stripped);
    }
  }

  return null;
}
