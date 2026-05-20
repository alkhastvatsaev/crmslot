/** Message nécessitant un outil serveur malgré le snapshot PWA injecté. */
export function messageNeedsChatbotTools(text: string): boolean {
  const t = text.toLowerCase();
  return /facture|devis|prix|montant|€|\beur\b|lecot|fournisseur|email|mail|courriel|envoyer|envoie|envoy|planning|technicien|assign|commande|billing|stock|timeline|note interne|facturer|patch|ajoute|ajouter|modifier|modifi|créer|crée|détail|intervention|dossier|cylindre|perceuse|serrure|verrou|poignée|poignee|gâche|gache|sku|référence|envoi|pièce|piece|matériel|materiel|statistique|stats?\b|kpi|inbox|portail|chat client|passe[zr]?|change[zr]?|affich|montr|cherch|trouv|list|relance|rappel|planifi|urgent|devis|barillet|gond|loquet|targette|client/i.test(
    t,
  );
}

/** Derniers messages utilisateur concaténés (multi-tours, ex. commande Lecot puis « une serrure »). */
export function recentUserMessagesText(messages: unknown[], max = 3): string {
  if (!Array.isArray(messages)) return "";
  const texts = messages
    .filter((m) => m && typeof m === "object" && (m as { role?: string }).role === "user")
    .map((m) => String((m as { content?: unknown }).content ?? "").trim())
    .filter(Boolean);
  return texts.slice(-max).join("\n");
}

/** Garde les outils si le dernier message OU le contexte récent le justifie. */
export function conversationNeedsChatbotTools(
  lastUserText: string,
  messages?: unknown[],
): boolean {
  if (messageNeedsChatbotTools(lastUserText)) return true;
  const recent = recentUserMessagesText(messages ?? [], 3);
  return recent.length > 0 && messageNeedsChatbotTools(recent);
}

/** Nombre de messages utilisateur dans l'historique API. */
export function countChatbotUserTurns(messages: unknown[]): number {
  if (!Array.isArray(messages)) return 0;
  return messages.filter(
    (m) => m && typeof m === "object" && (m as { role?: string }).role === "user",
  ).length;
}
