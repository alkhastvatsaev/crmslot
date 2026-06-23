import type { ChatbotToolDefinition } from "@/features/chatbot/chatbot-tools-types";

/** Outils écriture dossier intervention (statut, planning, email, timeline). */
export const CHATBOT_INTERVENTION_WRITE_TOOL_DEFINITIONS: ChatbotToolDefinition[] = [
  {
    name: "update_intervention_status",
    description:
      "Change le statut d'une intervention. Nécessite userConfirmed=true après accord explicite de l'utilisateur.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        status: {
          type: "string",
          enum: [
            "pending",
            "assigned",
            "en_route",
            "in_progress",
            "done",
            "invoiced",
            "cancelled",
            "waiting_material",
          ],
        },
        note: { type: "string", description: "Commentaire interne optionnel" },
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "status", "userConfirmed"],
    },
  },
  {
    name: "assign_technician",
    description:
      "Assigne un technicien à une intervention (statut assigned). userConfirmed=true obligatoire.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        technicianUid: { type: "string" },
        scheduledDate: { type: "string" },
        scheduledTime: { type: "string" },
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "technicianUid", "userConfirmed"],
    },
  },
  {
    name: "update_intervention_schedule",
    description: "Met à jour la date/heure planifiée. userConfirmed=true obligatoire.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        scheduledDate: { type: "string" },
        scheduledTime: { type: "string" },
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "scheduledDate", "scheduledTime", "userConfirmed"],
    },
  },
  {
    name: "add_timeline_comment",
    description:
      "Ajoute une note interne sur la timeline du dossier. userConfirmed=true obligatoire.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        content: { type: "string" },
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "content", "userConfirmed"],
    },
  },
  {
    name: "save_client_email",
    description:
      "Enregistre l'adresse email sur le dossier intervention et la fiche CRM (champ `em` du snapshot pour les prochains messages). Utilise quand l'utilisateur donne un mail dans le chat sans envoyer tout de suite, ou avant send_intervention_email.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        email: { type: "string", description: "Adresse email à mémoriser" },
      },
      required: ["interventionId", "email"],
    },
  },
  {
    name: "send_intervention_email",
    description:
      "Envoie un email au client lié à une intervention. Par défaut joint le PDF facture du dossier (attachDocumentType=invoice). Devis → quote. Omettre attachDocumentType ou invoice si l'utilisateur demande d'envoyer la facture / le PDF. none uniquement si envoi sans pièce jointe explicite. Utilise `em` du snapshot ou clientEmail si présent ; adresse citée dans le chat → `to`. userConfirmed=true obligatoire.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        to: { type: "string", description: "Adresse email du destinataire" },
        subject: { type: "string" },
        bodyText: { type: "string", description: "Corps du message en texte brut" },
        inReplyTo: {
          type: "string",
          description: "Message-ID d'un email existant pour répondre dans le fil (optionnel)",
        },
        attachDocumentType: {
          type: "string",
          enum: ["invoice", "quote", "none"],
          description:
            "PDF joint généré depuis le dossier : invoice=facture (défaut, à utiliser pour « envoyer la facture »), quote=devis, none=sans PJ",
        },
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "to", "subject", "bodyText", "userConfirmed"],
    },
  },
];
