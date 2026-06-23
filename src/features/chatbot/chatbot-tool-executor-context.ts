import { isChatbotWriteTool } from "@/features/chatbot/chatbot-tools";

export type ChatbotToolContext = {
  companyId: string;
  actorUid: string;
  role: "admin" | "collaborateur" | null;
  /** Dernier message utilisateur (routage PJ email). */
  lastUserText?: string | null;
  /** Agent Matériel : nom client mémorisé pour les commandes (panneau Commandes). */
  materialOrderClientName?: string | null;
  /** Agent Matériel : refuser order_lecot sans clientName. */
  requireMaterialOrderClientName?: boolean;
  /** Commande dossier — injectée dans order_lecot_parts. */
  materialOrderInterventionId?: string | null;
  /** Clé API OpenAI — nécessaire pour les outils vision (diagnose_equipment_photo). */
  openAIApiKey?: string;
  /** Modèle OpenAI utilisé — transmis aux outils qui lancent leur propre appel. */
  openAIModelName?: string;
};

function requireConfirmed(name: string, input: Record<string, unknown>): void {
  // order_lecot_parts gère sa propre confirmation via le panel UI Lecot (chatbot-openai.ts).
  // userConfirmed=true y est injecté par le flow confirmTool, pas ici.
  if (name === "order_lecot_parts") return;
  if (!isChatbotWriteTool(name)) return;
  if (input.userConfirmed !== true) {
    throw new Error(
      "Action refusée : confirmation utilisateur requise (userConfirmed: true) avant toute modification."
    );
  }
}

/**
 * Tools qui mutent la facturation / champs sensibles (paymentStatus, invoiceAmountCents…).
 * Côté firestore.rules ces champs sont réservés au rôle `admin` via `interventionSensitiveBillingUnchanged`,
 * mais le chatbot passe par l'Admin SDK et contourne ces rules. On reproduit donc le check serveur.
 *
 * Le path `confirmTool` permet de forcer `userConfirmed: true` côté client — sans ce garde-fou,
 * un collaborateur pourrait modifier les montants ou marquer paid sans Stripe.
 */
const CHATBOT_ADMIN_ONLY_TOOLS = new Set<string>([
  "patch_intervention_billing",
  "update_intervention_billing",
  "append_intervention_billing_lines",
  "approve_material_orders",
]);

function requireAdminRoleForSensitiveTool(name: string, ctx: ChatbotToolContext): void {
  if (!CHATBOT_ADMIN_ONLY_TOOLS.has(name)) return;
  if (ctx.role !== "admin") {
    throw new Error(
      "Action refusée : seul un administrateur de la société peut modifier la facturation."
    );
  }
}

export { requireConfirmed, requireAdminRoleForSensitiveTool };
