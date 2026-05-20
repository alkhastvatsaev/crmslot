import { shouldPreferChatbotEmailOverLecot } from "@/features/chatbot/chatbot-email-intent";

/** Outils toujours utiles pour chercher un dossier / client. */
export const CHATBOT_TOOL_CORE = [
  "search_workspace",
  "list_interventions",
  "get_intervention_detail",
  "list_clients",
  "get_client_detail",
] as const;

/** Inclure get_workspace_summary uniquement si aucun snapshot n'est injecté dans le system prompt. */
export const CHATBOT_TOOL_CORE_NO_SNAPSHOT = [
  "get_workspace_summary",
  ...CHATBOT_TOOL_CORE,
] as const;

export const CHATBOT_TOOL_BILLING = [
  "get_intervention_billing",
  "patch_intervention_billing",
  "update_intervention_billing",
  "focus_intervention_document",
] as const;

export const CHATBOT_TOOL_LECOT = [
  "search_lecot_products",
  "order_lecot_parts",
  "list_supplier_orders",
  "list_material_orders",
] as const;

export const CHATBOT_TOOL_EMAIL = [
  "list_intervention_emails",
  "save_client_email",
  "send_intervention_email",
] as const;

export const CHATBOT_TOOL_PLANNING = [
  "list_technicians",
  "get_technician_planning",
  "assign_technician",
  "update_intervention_schedule",
  "update_intervention_status",
] as const;

export const CHATBOT_TOOL_STATS = ["statistiques_periode", "list_quotes"] as const;

export const CHATBOT_TOOL_INBOX = ["list_inbox_notifications", "list_portal_chat"] as const;

/** Boîte Gmail connectée (page 6) — colis, mails clients, suivi. */
export const CHATBOT_TOOL_GMAIL = [
  "list_gmail_inbox",
  "get_gmail_message",
  "suggest_gmail_intervention_links",
  "send_gmail_reply",
  "link_gmail_to_intervention",
] as const;

export const CHATBOT_TOOL_STOCK = ["list_stock_alerts"] as const;

export const CHATBOT_TOOL_TIMELINE = ["add_timeline_comment"] as const;

const BILLING_HINT =
  /facture|devis|prix|montant|€|eur\b|euro|facturer|billing|paiement|encaissement/i;
const LECOT_HINT =
  /lecot|fournisseur|commande\s+(?:mat|matériel|materiel)|sku|référence|reference|perceuse|visseuse|perforateur|meuleuse|cylindre|serrure|verrou|catalogue/i;
const EMAIL_HINT =
  /email|mail|courriel|envo(?:y|i)e[rz]?\s+.*\b(?:mail|email|courriel)\b|envoyer?\s+.*\b(?:mail|email|courriel)\b|pi[eè]ce\s+jointe/i;
const PLANNING_HINT =
  /planning|planifier|assign|technicien|créneau|horaire|rdv|rendez-vous|en_route|statut/i;
const STATS_HINT = /statistique|chiffre|ca\b|chiffre d'affaires|trimestre|mois|kpi/i;
const INBOX_HINT = /inbox|notification|portail|chat client|ivana/i;
const GMAIL_HINT =
  /gmail|bo[iî]te\s+(?:mail|réception)|mes\s+mails|nouveau(?:x)?\s+mails?|colis|livraison|bpost|colissimo|dpd|chronopost|gls|tracking|num[eé]ro\s+de\s+suivi|exp[eé]dition|transporteur|mail\s+re[cç]u/i;
const STOCK_HINT = /stock|alerte stock|rupture/i;
const TIMELINE_HINT = /note interne|commentaire|timeline|historique dossier/i;

const GREETING_HINT = /^(bonjour|salut|hey|hello|coucou|bonsoir|ça va|ca va|merci|ok)\s*[?!.]*$/i;

/**
 * Sous-ensemble d'outils pour limiter les tokens OpenAI (descriptions + schémas).
 * `undefined` = tous les outils (conversation générale).
 */
export function inferChatbotToolScope(userText: string): string[] | undefined {
  const t = userText.trim();
  if (!t) return undefined;
  
  if (GREETING_HINT.test(t)) return [];

  if (shouldPreferChatbotEmailOverLecot(t)) {
    return [...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_EMAIL, ...CHATBOT_TOOL_BILLING];
  }

  const scopes: string[][] = [];

  if (EMAIL_HINT.test(t)) {
    scopes.push([...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_EMAIL, ...CHATBOT_TOOL_BILLING]);
  }
  if (BILLING_HINT.test(t)) {
    scopes.push([...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_BILLING]);
  }
  if (LECOT_HINT.test(t)) {
    scopes.push([...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_LECOT]);
  }
  if (PLANNING_HINT.test(t)) {
    scopes.push([...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_PLANNING]);
  }
  if (STATS_HINT.test(t)) {
    scopes.push([...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_STATS]);
  }
  if (INBOX_HINT.test(t)) {
    scopes.push([...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_INBOX]);
  }
  if (GMAIL_HINT.test(t)) {
    scopes.push([...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_GMAIL]);
  }
  if (STOCK_HINT.test(t)) {
    scopes.push([...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_STOCK]);
  }

  if (scopes.length === 0) return [...CHATBOT_TOOL_CORE];

  const merged = new Set<string>();
  for (const group of scopes) {
    for (const name of group) merged.add(name);
  }
  if (TIMELINE_HINT.test(t)) {
    merged.add("add_timeline_comment");
  }
  return [...merged];
}

export function filterChatbotToolDefinitions<T extends { name: string }>(
  definitions: T[],
  scope: string[] | undefined,
): T[] {
  if (scope === undefined) return definitions;
  if (scope.length === 0) return [];
  const allowed = new Set(scope);
  const filtered = definitions.filter((d) => allowed.has(d.name));
  const coreNames = new Set<string>(CHATBOT_TOOL_CORE);
  return filtered.length > 0 ? filtered : definitions.filter((d) => coreNames.has(d.name));
}
