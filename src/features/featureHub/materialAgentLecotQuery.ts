import { parseLecotInstantOrderIntent } from "@/features/chatbot/chatbot-lecot-instant-order-intent";
import { isChatbotLecotOrderIntent } from "@/features/chatbot/chatbot-email-intent";
import {
  extractLecotProductKeyword,
  normalizeLecotProductSearchQuery,
  priorMessagesHaveLecotContext,
  resolveLecotCatalogSearchQuery,
} from "@/features/chatbot/chatbot-lecot-follow-up";
import {
  isAwaitingMaterialAgentClientName,
  parseMaterialAgentClientNameFromUserText,
} from "@/features/featureHub/materialAgentOrderClient";

/** Recherche catalogue par défaut sur la page Matériel (serrurerie). */
export const MATERIAL_AGENT_LECOT_DEFAULT_QUERY = "serrure cylindre";

const SUGGEST_PRODUCTS_RE =
  /sugg[eè]re|propose|montre|liste|catalogue|produits?|articles?|références?|references?/i;

/** Nom client seul (ex. Dupont) — pas une recherche catalogue instantanée. */
function looksLikeClientNameCatalogReply(text: string): boolean {
  const t = text.trim();
  if (t.length < 2 || t.length > 48) return false;
  if (extractLecotProductKeyword(t)) return false;
  if (/^[a-zàâäéèêëïîôùûüç0-9]/i.test(t) && t === t.toLowerCase()) return false;
  return /^[\p{L}][\p{L}\p{M}'.\-\s]{1,47}$/u.test(t);
}

function isBareLecotQuery(query: string): boolean {
  const q = query.trim().toLowerCase();
  return q === "lecot" || q === "chez lecot" || q === "catalogue lecot";
}

/** Phrase catalogue / commande sans mot-clé produit exploitable. */
function isGenericLecotCatalogPhrase(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (isChatbotLecotOrderIntent(t) && !extractLecotProductKeyword(t)) return true;
  if (SUGGEST_PRODUCTS_RE.test(t) && !extractLecotProductKeyword(t)) return true;
  if (
    /^(?:montre|liste|affiche|voir)\b/i.test(t) &&
    /\b(catalogue|lecot|fournisseur|produits?|articles?|références?|references?)\b/i.test(t)
  ) {
    return true;
  }
  return false;
}

function normalizeMaterialAgentLecotBaseQuery(
  lastUserText: string,
  base: string | null,
  inLecotFlow: boolean,
): string | null {
  if (!base) {
    return isGenericLecotCatalogPhrase(lastUserText) ? MATERIAL_AGENT_LECOT_DEFAULT_QUERY : null;
  }
  if (isBareLecotQuery(base)) return MATERIAL_AGENT_LECOT_DEFAULT_QUERY;

  const kw = extractLecotProductKeyword(base);
  if (kw) return kw;

  if (
    inLecotFlow &&
    (isGenericLecotCatalogPhrase(lastUserText) ||
      isGenericLecotCatalogPhrase(base) ||
      /\b(commande|catalogue|commander|fournisseur|lecot|matériel|materiel|pièce|piece)\b/i.test(base))
  ) {
    return MATERIAL_AGENT_LECOT_DEFAULT_QUERY;
  }

  if (
    inLecotFlow &&
    !isGenericLecotCatalogPhrase(base) &&
    !looksLikeClientNameCatalogReply(base)
  ) {
    const normalized = normalizeLecotProductSearchQuery(base);
    if (normalized.length >= 2 && normalized.length <= 80) return normalized;
  }

  return null;
}

/**
 * Requête catalogue pour l'agent Matériel — réutilise la logique Ivana + défauts métier.
 */
export function resolveMaterialAgentLecotSearchQuery(
  lastUserText: string,
  messages: unknown[],
): string | null {
  if (parseLecotInstantOrderIntent(lastUserText)) return null;

  if (isAwaitingMaterialAgentClientName(messages)) {
    if (parseMaterialAgentClientNameFromUserText(lastUserText)) return null;
  }

  const t = lastUserText.trim();
  const inLecotFlow =
    isChatbotLecotOrderIntent(t) || priorMessagesHaveLecotContext(messages) || /\blecot\b/i.test(t);

  const productInMessage = extractLecotProductKeyword(t);
  if (productInMessage) return normalizeLecotProductSearchQuery(productInMessage);

  const base = resolveLecotCatalogSearchQuery(lastUserText, messages);

  if (SUGGEST_PRODUCTS_RE.test(t) && !productInMessage && (!base || isGenericLecotCatalogPhrase(t))) {
    return MATERIAL_AGENT_LECOT_DEFAULT_QUERY;
  }

  return normalizeMaterialAgentLecotBaseQuery(t, base, inLecotFlow);
}
