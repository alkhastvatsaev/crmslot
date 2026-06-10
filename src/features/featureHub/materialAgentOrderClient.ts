import { isChatbotLecotOrderIntent } from "@/features/chatbot/chatbot-email-intent";
import { parseLecotInstantOrderIntent } from "@/features/chatbot/chatbot-lecot-instant-order-intent";
import { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";
import { requireMaterialOrderClientName } from "@/features/materials/materialOrderClientName";

/** Marqueur dans l'historique assistant — détection « en attente du nom client ». */
export const MATERIAL_AGENT_CLIENT_NAME_MARKER = "[[material-agent-need-client-name]]";

export const MATERIAL_AGENT_ASK_CLIENT_NAME_TEXT =
  "Quel est le **nom du client** pour cette commande ? (ex. Dupont, Martin SPRL — il apparaîtra dans le panneau Commandes à droite.)";

export function materialAgentAskClientNameAssistantContent(): string {
  return `${MATERIAL_AGENT_ASK_CLIENT_NAME_TEXT}\n${MATERIAL_AGENT_CLIENT_NAME_MARKER}`;
}

/** Démarre un nouveau parcours Lecot — ne pas réutiliser le client de la commande précédente. */
export function shouldResetMaterialOrderClientSession(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/nouvelle\s+commande|autre\s+client|changer\s+(?:de\s+)?client|nouveau\s+client/i.test(t)) {
    return true;
  }
  if (isChatbotLecotOrderIntent(t)) return true;
  if (/^(?:sugg[eè]re|propose|montre|liste|catalogue)\b/i.test(t)) return true;
  return false;
}

/** Texte commande / catalogue Lecot — jamais un nom de client. */
export function isMaterialAgentLecotCommandText(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (parseLecotInstantOrderIntent(t)) return true;
  if (isChatbotLecotOrderIntent(t)) return true;
  if (shouldResetMaterialOrderClientSession(t)) return true;
  if (/\blecot\b/i.test(t)) return true;
  if (
    /\b(commande|catalogue|commander|nouvelle|sugg[eè]re|propose|recherche|rupture|stock|matériel|materiel|articles?)\b/i.test(
      t
    )
  ) {
    return true;
  }
  return false;
}

export function isAwaitingMaterialAgentClientName(messages: unknown[]): boolean {
  const stored = normalizeStoredMessages(messages);
  let skippedLatestUser = false;
  for (let i = stored.length - 1; i >= 0; i -= 1) {
    const m = stored[i];
    if (m.role === "user") {
      if (!skippedLatestUser) {
        skippedLatestUser = true;
        continue;
      }
      break;
    }
    if (m.role === "assistant" && typeof m.content === "string") {
      return m.content.includes(MATERIAL_AGENT_CLIENT_NAME_MARKER);
    }
  }
  return false;
}

function looksLikeStandaloneClientName(text: string): boolean {
  const t = text.trim();
  if (t.length < 2 || t.length > 80) return false;
  if (/^[0-9]+$/.test(t)) return false;
  if (!/^[\p{L}][\p{L}\p{M}'.\-\s]{0,79}$/u.test(t)) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 6) return false;
  return true;
}

/**
 * Nom client saisi par l'utilisateur — uniquement si réponse à la question explicite
 * ou préfixe « client … » / « nom : … ». Jamais une phrase de commande Lecot.
 */
export function parseMaterialAgentClientNameFromUserText(
  text: string,
  messages?: unknown[]
): string | null {
  const t = text.trim();
  if (!t) return null;

  // "Commander N× "…" (réf. SKU) — société : COMPANY" (format bouton modal stock)
  // À vérifier en premier : le message entier ressemble à une commande mais contient le nom client.
  const societeMatch = t.match(/[—–\-]\s*soci[eé]t[eé]\s*:\s*(.+)$/i);
  if (societeMatch?.[1]?.trim()) {
    const name = societeMatch[1].trim();
    return isMaterialAgentLecotCommandText(name) ? null : name;
  }

  if (isMaterialAgentLecotCommandText(t)) return null;

  const explicitColon = t.match(/^(?:client|nom(?:\s+du\s+client)?)\s*[:—–-]\s*(.+)$/i);
  if (explicitColon?.[1]?.trim()) {
    const name = explicitColon[1].trim();
    return isMaterialAgentLecotCommandText(name) ? null : name;
  }
  const explicitPrefix = t.match(/^client\s+(.+)$/i);
  if (explicitPrefix?.[1]?.trim()) {
    const name = explicitPrefix[1].trim();
    return isMaterialAgentLecotCommandText(name) ? null : name;
  }
  // "c'est pour Dupont" / "pour le client Martin" / "commande pour SPRL X"
  const pourMatch = t.match(
    /^(?:c'?est\s+pour|pour\s+(?:le\s+client\s+|la\s+soci[eé]t[eé]\s+)?|commande\s+pour\s+)(.+)$/i
  );
  if (pourMatch?.[1]?.trim()) {
    const name = pourMatch[1].trim();
    return isMaterialAgentLecotCommandText(name) ? null : name;
  }
  if (messages && isAwaitingMaterialAgentClientName(messages) && looksLikeStandaloneClientName(t)) {
    return t;
  }

  return null;
}

export function resolveMaterialAgentOrderClientName(params: {
  orderClientNameFromClient?: string | null;
  messages: unknown[];
  lastUserText: string;
}): string | null {
  if (shouldResetMaterialOrderClientSession(params.lastUserText)) {
    return null;
  }

  const fromSession = params.orderClientNameFromClient?.trim();
  if (fromSession) {
    try {
      return requireMaterialOrderClientName(fromSession);
    } catch {
      /* invalid session value */
    }
  }

  if (isAwaitingMaterialAgentClientName(params.messages)) {
    const parsed = parseMaterialAgentClientNameFromUserText(params.lastUserText, params.messages);
    if (parsed) {
      try {
        return requireMaterialOrderClientName(parsed);
      } catch {
        return null;
      }
    }
  }

  return null;
}

export function buildMaterialAgentClientNameRegisteredReply(clientName: string): string {
  return `Client enregistré : **${clientName}**. Vous pouvez commander un article (bouton Commander ou « Commander N »).`;
}
