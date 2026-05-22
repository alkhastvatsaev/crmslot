import { parseLecotInstantOrderIntent } from "@/features/chatbot/chatbot-lecot-instant-order-intent";
import { isChatbotLecotOrderIntent } from "@/features/chatbot/chatbot-email-intent";
import {
  extractLecotProductKeyword,
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

  // Don't route arbitrary strings (proper nouns, client names…) to the instant shortcut.
  // Only known product keywords or catalog phrases qualify.
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
  if (productInMessage) return productInMessage;

  const base = resolveLecotCatalogSearchQuery(lastUserText, messages);

  if (SUGGEST_PRODUCTS_RE.test(t) && !productInMessage && (!base || isGenericLecotCatalogPhrase(t))) {
    return MATERIAL_AGENT_LECOT_DEFAULT_QUERY;
  }

  return normalizeMaterialAgentLecotBaseQuery(t, base, inLecotFlow);
}
