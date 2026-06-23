import type { ChatbotToolDefinition } from "@/features/chatbot/chatbot-tools-types";

/** Outils Gmail — lecture boîte, liaison dossier, réponses. */
export const CHATBOT_GMAIL_TOOL_DEFINITIONS: ChatbotToolDefinition[] = [
  {
    name: "list_gmail_inbox",
    description:
      "Lit la boîte Gmail connectée (page 6 — même compte OAuth). Liste les mails récents avec extrait. Utilise pour colis (Bpost, Colissimo, DPD…), mails clients non encore dans un dossier, ou « quoi de neuf dans mes mails ». Paramètre q = syntaxe recherche Gmail (ex. « colis OR bpost », « from:client@be », « is:unread »). Enchaîne avec get_gmail_message pour le corps complet.",
    input_schema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Recherche Gmail (optionnel)" },
        labelId: { type: "string", description: "INBOX, STARRED, etc. (optionnel)" },
        unreadOnly: { type: "boolean", description: "Uniquement non lus" },
        limit: { type: "number", description: "Nombre max (défaut 12, max 20)" },
      },
    },
  },
  {
    name: "get_gmail_message",
    description:
      "Corps complet d'un mail Gmail (id retourné par list_gmail_inbox). Indispensable pour numéro de colis, adresse client, demande dans un email entrant.",
    input_schema: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "ID message Gmail" },
      },
      required: ["messageId"],
    },
  },
  {
    name: "suggest_gmail_intervention_links",
    description:
      "Propose des dossiers intervention à lier à un mail Gmail (lecture seule, scoring email/nom/corps). Appelle avant link_gmail_to_intervention quand le dossier n'est pas évident.",
    input_schema: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "ID message Gmail" },
      },
      required: ["messageId"],
    },
  },
  {
    name: "send_gmail_reply",
    description:
      "Compose et envoie une réponse Gmail à un mail spécifique. Utilise quand l'utilisateur demande de répondre à un mail (ex: 'Réponds au mail de client@example.com en disant que l'intervention est fixée lundi'). Requiert l'id du mail (obtenu via list_gmail_inbox ou get_gmail_message). Ne jamais envoyer sans confirmation explicite de l'utilisateur.",
    input_schema: {
      type: "object",
      properties: {
        messageId: {
          type: "string",
          description: "ID du mail auquel répondre (obtenu via list_gmail_inbox)",
        },
        bodyText: { type: "string", description: "Corps de la réponse en texte plain" },
        to: {
          type: "string",
          description:
            "Adresse email du destinataire (optionnel, déduit du mail original si absent)",
        },
        subject: {
          type: "string",
          description: "Sujet (optionnel, 'Re: <sujet original>' par défaut)",
        },
      },
      required: ["messageId", "bodyText"],
    },
  },
  {
    name: "link_gmail_to_intervention",
    description:
      "Lie un mail Gmail à une intervention existante et sauvegarde les infos extraites (expéditeur, corps) dans le dossier. Utile quand un client envoie un mail avec des informations pertinentes pour un dossier (demande, adresse, update de colis…). Appelle get_gmail_message puis search_workspace avant d'appeler cet outil.",
    input_schema: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "ID du mail Gmail" },
        interventionId: { type: "string", description: "ID de l'intervention à lier" },
        note: {
          type: "string",
          description: "Note optionnelle à ajouter à la timeline de l'intervention",
        },
      },
      required: ["messageId", "interventionId"],
    },
  },
];
