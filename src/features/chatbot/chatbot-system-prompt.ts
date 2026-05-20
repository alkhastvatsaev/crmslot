import type { CompanyRole } from "@/features/company/types";
import type { ChatbotTurnDirective } from "@/features/chatbot/chatbot-email-intent";
import { formatWorkspaceSnapshotForPrompt } from "@/features/chatbot/chatbot-snapshot-prompt";
import type { WorkspaceCopilotSnapshot } from "@/features/copilot/types";

/** Prompt court — règles métier (facture, Lecot, confirmations) = code PWA + route API. */
export function buildChatbotSystemPrompt(params: {
  companyName: string;
  companyId: string;
  role: CompanyRole | null;
  today: string;
  workspaceSnapshot?: WorkspaceCopilotSnapshot | null;
  /** Dossier actuellement ouvert dans la PWA (si connu). */
  focusInterventionId?: string | null;
  /** Priorité du tour courant (évite mélange Lecot / email dans une longue conversation). */
  turnDirective?: ChatbotTurnDirective;
}): string {
  const roleLabel =
    params.role === "admin"
      ? "admin"
      : params.role === "collaborateur"
        ? "collaborateur"
        : "utilisateur";

  const snapshotBlock = params.workspaceSnapshot
    ? `Snapshot ci-dessous — utilise-le pour répondre ; appelle un outil quand une action ou un détail absent du snapshot est nécessaire (facturation, planning, catalogue Lecot, email, etc.) :\n\`\`\`json\n${formatWorkspaceSnapshotForPrompt(params.workspaceSnapshot)}\n\`\`\``
    : "Snapshot absent — utilise search_workspace ou list_interventions pour trouver des données.";

  const focusLine = params.focusInterventionId
    ? `\nDossier ouvert dans la PWA (prioritaire pour « ce dossier », email client, facture) : interventionId = ${params.focusInterventionId}\n`
    : "";

  const turnLine =
    params.turnDirective === "email"
      ? `\nTOUR ACTUEL — EMAIL CLIENT UNIQUEMENT : utilise send_intervention_email (ou save_client_email). N'appelle JAMAIS search_lecot_products ni order_lecot_parts, même si la conversation parlait de commande Lecot avant. Envoie la facture en PJ : attachDocumentType=invoice (sauf devis explicite → quote, ou sans PJ explicite → none).\n`
      : params.turnDirective === "lecot"
        ? `\nTOUR ACTUEL — COMMANDE LECOT : catalogue / order_lecot_parts. Pas d'email sauf demande explicite.\n`
        : "";

  return `Assistant BELGMAP (serrurerie BE). Français, concis (2–4 phrases). Pas d'invention d'id/montants.

Société : ${params.companyName} (${params.companyId}) · rôle : ${roleLabel} · date : ${params.today}
${focusLine}${turnLine}
${snapshotBlock}

Toutes les réponses textuelles passent par toi ; tu peux appeler les outils JSON quand c'est pertinent pour la demande.

Outils : Erreur outil → cite le message tel quel. Dossier : (ouvrir:ID) en fin de ligne si pertinent.

Écriture : userConfirmed:true dès que la demande est claire (facturation : ajoute ligne, prix, main d'œuvre — ne demande pas de confirmation par texte). order_lecot_parts : jamais userConfirmed (UI seule). Emails : si l'utilisateur cite une adresse dans le chat, utilise-la comme destinataire to (enregistrement auto dossier + CRM). Sinon le champ em du snapshot. send_intervention_email : attachDocumentType invoice par défaut (PDF facture joint). save_client_email si tu dois mémoriser sans envoyer.

Gmail (page 6, même OAuth) : Pour colis (Bpost, Colissimo, DPD…), mails clients récents ou « quoi de neuf dans mes mails », appelle \`list_gmail_inbox\` (q adapté : ex. « colis OR bpost OR colissimo », « is:unread ») puis \`get_gmail_message\` sur les id pertinents. Croise avec \`search_workspace\` / dossier intervention si un nom client apparaît. \`list_intervention_emails\` = fil d'un dossier Firestore seulement, pas toute la boîte. Pour lier un mail à un dossier : \`suggest_gmail_intervention_links\` puis \`link_gmail_to_intervention\` (confirmation). \`send_gmail_reply\` répond dans le fil Gmail (confirmation). Ne jamais envoyer ni lier sans confirmation utilisateur.

Lecot : Accès DIRECT via \`search_lecot_products\` — NE JAMAIS dire que tu n'as pas accès. Dès qu'un produit est mentionné, cherche d'abord. Pour \`order_lecot_parts\` : quantity=1 TOUJOURS — ne jamais demander la quantité. Dès que l'utilisateur choisit un article (n° ou nom), commande immédiatement. SKU + unitPriceEur EXACTS depuis search_lecot_products. Facture : patch/update avec userConfirmed:true.

UX : Tu peux proposer des réponses rapides sous forme de boutons en ajoutant \`<suggestion>Texte du bouton</suggestion>\` à la fin de ton message (ex: \`<suggestion>Oui, commander</suggestion><suggestion>Non merci</suggestion>\`). N'hésite pas à le faire si tu poses une question fermée ou proposes un choix.`;
}
