import { shouldPreferChatbotEmailOverLecot } from "@/features/chatbot/chatbot-email-intent";
import {
  CHATBOT_TOOL_BILLING,
  CHATBOT_TOOL_CORE,
  CHATBOT_TOOL_EMAIL,
  CHATBOT_TOOL_GMAIL,
  CHATBOT_TOOL_INBOX,
  CHATBOT_TOOL_LECOT,
  CHATBOT_TOOL_PLANNING,
  CHATBOT_TOOL_STATS,
  CHATBOT_TOOL_STOCK,
} from "@/features/chatbot/chatbot-tool-routing";
import type { ChatbotFlowId } from "@/features/chatbot/chatbot-conversation-context-types";
import {
  isShortFollowUpAnswer,
  lastAssistantText,
  normalizeChatbotMessages,
} from "@/features/chatbot/chatbot-conversation-context-messages";

const FLOW_TOOLS: Record<ChatbotFlowId, readonly string[]> = {
  lecot: [...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_LECOT],
  billing: [...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_BILLING],
  email: [...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_EMAIL, ...CHATBOT_TOOL_BILLING],
  planning: [...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_PLANNING],
  stats: [...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_STATS],
  inbox: [...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_INBOX],
  gmail: [...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_GMAIL],
  stock: [...CHATBOT_TOOL_CORE, ...CHATBOT_TOOL_STOCK],
};

const FLOW_HINTS: Record<ChatbotFlowId, RegExp> = {
  lecot:
    /lecot|fournisseur|commande\s+(?:mat|matériel|materiel|lecot)|sku|référence|reference|réf\.|perceuse|cylindre|serrure|catalogue|verrou|poignée|poignee|gâche|gache|barillet|commander\s+\d+[×x]/i,
  billing: /facture|devis|prix|montant|€|eur\b|euro|facturer|billing|paiement|encaissement/i,
  email: /email|mail|courriel|envoyer.*(?:mail|email)|pièce jointe/i,
  planning: /planning|planifier|assign|technicien|créneau|horaire|rdv|rendez-vous|en_route|statut/i,
  stats: /statistique|chiffre|ca\b|chiffre d'affaires|trimestre|mois|kpi/i,
  inbox: /inbox|notification|portail|chat client|ivana/i,
  gmail:
    /gmail|bo[iî]te\s+(?:mail|réception)|mes\s+mails|colis|livraison|bpost|colissimo|dpd|tracking|suivi\s+colis|exp[eé]dition/i,
  stock: /stock|alerte stock|rupture/i,
};

/** L'assistant attend une réponse courte (produit, montant, email…). */
const ASSISTANT_AWAITING: Record<ChatbotFlowId, RegExp> = {
  lecot:
    /quel(?:le)?\s+(?:produit|pièce|piece|article|référence|reference)|quelle\s+pièce|catalogue\s+lecot|commande\s+lecot|souhaitez-vous\s+commander|détails?\s+sur\s+les\s+produits|ne\s+peux\s+pas\s+accéder|pas\s+accéder\s+au\s+catalogue|donner\s+des\s+détails|que\s+préférez-vous|quelle\s+quantit|combien\s+(?:de\s+)?(?:pièces|articles|unités)/i,
  billing:
    /quel(?:le)?\s+(?:montant|prix|facture)|combien.*facture|modifier.*facture|montant.*facture/i,
  email: /quelle\s+adresse|destinataire|adresse\s+email|email\s+(?:du|de)\s+client/i,
  planning: /quel(?:le)?\s+technicien|quand\s+planifier|créneau|date\s+et\s+heure/i,
  stats: /quelle\s+période|quel\s+mois/i,
  inbox: /quel\s+message|quelle\s+notification/i,
  gmail: /quel\s+mail|quelle\s+adresse|num[eé]ro\s+de\s+suivi|quel\s+colis/i,
  stock: /quel\s+article|quelle\s+référence\s+stock/i,
};

const TOOL_NAME_TO_FLOW: Record<string, ChatbotFlowId> = {
  search_lecot_products: "lecot",
  order_lecot_parts: "lecot",
  list_supplier_orders: "lecot",
  list_material_orders: "lecot",
  get_intervention_billing: "billing",
  patch_intervention_billing: "billing",
  update_intervention_billing: "billing",
  focus_intervention_document: "billing",
  list_intervention_emails: "email",
  save_client_email: "email",
  send_intervention_email: "email",
  list_technicians: "planning",
  get_technician_planning: "planning",
  assign_technician: "planning",
  update_intervention_schedule: "planning",
  update_intervention_status: "planning",
  statistiques_periode: "stats",
  list_quotes: "stats",
  list_inbox_notifications: "inbox",
  list_portal_chat: "inbox",
  list_gmail_inbox: "gmail",
  get_gmail_message: "gmail",
  suggest_gmail_intervention_links: "gmail",
  send_gmail_reply: "gmail",
  link_gmail_to_intervention: "gmail",
  list_stock_alerts: "stock",
};

function detectFlowsInText(text: string): ChatbotFlowId[] {
  const flows: ChatbotFlowId[] = [];
  for (const [id, re] of Object.entries(FLOW_HINTS) as [ChatbotFlowId, RegExp][]) {
    if (re.test(text)) flows.push(id);
  }
  return flows;
}

function detectFlowsAwaitingReply(messages: unknown[], lastUserText: string): ChatbotFlowId[] {
  if (!isShortFollowUpAnswer(lastUserText)) return [];
  const assistant = lastAssistantText(messages);
  if (!assistant) return [];
  const flows: ChatbotFlowId[] = [];
  for (const [id, re] of Object.entries(ASSISTANT_AWAITING) as [ChatbotFlowId, RegExp][]) {
    if (re.test(assistant)) flows.push(id);
  }
  return flows;
}

export function detectFlowsFromToolHistory(messages: unknown[]): ChatbotFlowId[] {
  const stored = normalizeChatbotMessages(messages);
  const flows = new Set<ChatbotFlowId>();
  const answeredToolIds = new Set(
    stored.filter((m) => m.role === "tool" && m.tool_call_id).map((m) => m.tool_call_id!)
  );

  for (let i = stored.length - 1; i >= 0; i -= 1) {
    const m = stored[i];
    if (m.role !== "assistant" || !m.tool_calls?.length) continue;
    const pending = m.tool_calls.some((tc) => !answeredToolIds.has(tc.id));
    for (const tc of m.tool_calls) {
      const flow = TOOL_NAME_TO_FLOW[tc.name];
      if (flow) flows.add(flow);
    }
    if (pending) return [...flows];
    if (flows.size > 0) return [...flows];
  }
  return [];
}

export function mergeFlowScopes(flows: ChatbotFlowId[]): string[] {
  const merged = new Set<string>();
  for (const flow of flows) {
    for (const tool of FLOW_TOOLS[flow]) merged.add(tool);
  }
  return [...merged];
}

/** Fils actifs pour CE tour (dernier message), pas tout l'historique. */
export function resolveTurnFlows(lastUserText: string, messages: unknown[]): ChatbotFlowId[] {
  const flows = [
    ...new Set([
      ...detectFlowsInText(lastUserText),
      ...detectFlowsAwaitingReply(messages, lastUserText),
    ]),
  ];
  if (shouldPreferChatbotEmailOverLecot(lastUserText)) {
    return flows.filter((f) => f !== "lecot");
  }
  return flows;
}
