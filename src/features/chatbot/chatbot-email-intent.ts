import { extractEmailAddressFromText } from "@/features/chatbot/chatbot-client-email";

/** Message utilisateur orienté envoi / rédaction d'email (pas commande fournisseur). */
export function isChatbotEmailIntent(text: string): boolean {
  const t = text.trim();
  if (!t) return false;

  if (
    /envo(?:y|i)e[rz]?\s+.*(?:e-?)?(?:mail|courriel)\b/i.test(t)
  ) {
    return true;
  }
  if (/\b(?:mail|email|courriel)\s+(?:à|a|pour|au|vers|client)\b/i.test(t)) return true;
  if (/pr[eéè]vien(?:s|t|d|dre)?\s+.*(?:client|par|mail|email|courriel)/i.test(t) && /(?:mail|email|courriel)/i.test(t)) return true;
  if (/^(?:mail|email|courriel)\s*:/i.test(t)) return true;
  if (/répond(?:re)?\s+(?:au\s+)?(?:mail|email|courriel)/i.test(t)) return true;
  if (/pi[eè]ce\s+jointe|pj\b/i.test(t) && /\b(?:mail|email|envo)/i.test(t)) return true;

  if (extractEmailAddressFromText(t) && /\b(?:envo|mail|email|courriel|facture|devis)\b/i.test(t)) {
    return true;
  }

  return false;
}

/** Commande matériel / catalogue Lecot explicite (prioritaire sur un fil email résiduel). */
export function isChatbotLecotOrderIntent(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/\blecot\b/i.test(t)) return true;
  if (/commande\s+(?:mat|matériel|materiel|lecot|fournisseur|pièce|piece)/i.test(t)) return true;
  if (/fournisseur|catalogue\s+lecot/i.test(t)) return true;
  if (/commander\s+(?:une?|un|des?)\s+(?:serrure|cylindre|perceuse|verrou|poign)/i.test(t)) {
    return true;
  }
  return false;
}

/** Email sur le dernier message, sauf si l'utilisateur parle clairement Lecot. */
export function shouldPreferChatbotEmailOverLecot(lastUserText: string): boolean {
  if (!isChatbotEmailIntent(lastUserText)) return false;
  return !isChatbotLecotOrderIntent(lastUserText);
}

export type ChatbotTurnDirective = "email" | "lecot" | null;

/** Consigne système pour le tour courant (évite les fuites Lecot ↔ email). */
export function resolveChatbotTurnDirective(lastUserText: string): ChatbotTurnDirective {
  if (shouldPreferChatbotEmailOverLecot(lastUserText)) return "email";
  if (isChatbotLecotOrderIntent(lastUserText)) return "lecot";
  return null;
}

/** Envoi email explicite dans le chat → pas de carte de confirmation intermédiaire. */
export function shouldAutoConfirmChatbotEmailWrite(
  toolName: string,
  lastUserText: string | null,
): boolean {
  if (!lastUserText?.trim()) return false;
  if (toolName !== "send_intervention_email") return false;
  return isChatbotEmailIntent(lastUserText);
}
