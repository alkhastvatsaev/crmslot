export type ChatbotToolDefinition = {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
};

/** Outils Chatbot — exécution serveur (Firebase Admin) ; écriture avec confirmation UI. */
export const CHATBOT_TOOL_DEFINITIONS: ChatbotToolDefinition[] = [
  {
    name: "get_workspace_summary",
    description:
      "Vue d'ensemble : compteurs interventions par statut, CA estimé, urgences, stock bas, techniciens.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_interventions",
    description:
      "Liste les interventions de la société active avec filtres optionnels.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description:
            "pending | assigned | en_route | in_progress | done | invoiced | cancelled | waiting_material",
        },
        urgentOnly: { type: "boolean" },
        scheduledDate: { type: "string", description: "AAAA-MM-JJ" },
        search: { type: "string", description: "Recherche client, adresse, problème" },
        limit: { type: "number", description: "Max 50, défaut 20" },
      },
    },
  },
  {
    name: "get_intervention_detail",
    description: "Détail complet d'une intervention par son id.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
      },
      required: ["interventionId"],
    },
  },
  {
    name: "search_workspace",
    description:
      "Recherche transversale PWA par nom, téléphone, email ou adresse : clients CRM, interventions et devis. À utiliser en premier pour un nom de personne (ex. « Vatsaev »).",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Texte à chercher (nom, tél., email…)" },
        limit: { type: "number", description: "Max par catégorie, défaut 25" },
      },
      required: ["query"],
    },
  },
  {
    name: "list_clients",
    description:
      "Liste le carnet clients CRM. Pour un nom précis, préférer search_workspace (couvre aussi les clients présents uniquement sur des interventions).",
    input_schema: {
      type: "object",
      properties: {
        search: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "get_client_detail",
    description:
      "Fiche client CRM par id : coordonnées, sites et interventions liées (clientId ou nom sur dossier).",
    input_schema: {
      type: "object",
      properties: {
        clientId: { type: "string" },
      },
      required: ["clientId"],
    },
  },
  {
    name: "list_quotes",
    description: "Liste les devis (quotes) de la société.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "draft | sent | accepted | refused" },
        interventionId: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "list_technicians",
    description: "Liste les techniciens de la société (planning / assignation).",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_stock_alerts",
    description: "Articles de stock sous le seuil d'alerte.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_material_orders",
    description: "Commandes matériel liées à une intervention.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "list_inbox_notifications",
    description: "Notifications inbox de l'utilisateur connecté (alertes, assignations, SLA).",
    input_schema: {
      type: "object",
      properties: {
        unreadOnly: { type: "boolean" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "list_intervention_emails",
    description: "Emails liés à une intervention (fil de communication).",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["interventionId"],
    },
  },
  {
    name: "get_intervention_billing",
    description:
      "Facturation d'une intervention : lignes, montants, statut paiement, PDF facture.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
      },
      required: ["interventionId"],
    },
  },
  {
    name: "list_portal_chat",
    description: "Messages chat portail client (Ivana) — société ou dossier précis.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string", description: "Optionnel — filtrer un dossier" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "statistiques_periode",
    description:
      "Statistiques chiffre d'affaires et volume d'interventions sur une période (mois, trimestre, année). Renvoie le CA facturé, les encaissements, le nombre de dossiers par statut.",
    input_schema: {
      type: "object",
      properties: {
        dateFrom: { type: "string", description: "Date début AAAA-MM-JJ" },
        dateTo: { type: "string", description: "Date fin AAAA-MM-JJ" },
        groupBy: { type: "string", description: "month | week | status (défaut : status)" },
      },
      required: ["dateFrom", "dateTo"],
    },
  },
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
    description:
      "Met à jour la date/heure planifiée. userConfirmed=true obligatoire.",
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
    name: "send_intervention_email",
    description:
      "Envoie un email au client (ou autre destinataire) lié à une intervention via la boîte Gmail configurée (SMTP). Enregistre le fil dans intervention_emails. userConfirmed=true obligatoire. Utilise get_intervention_detail / list_intervention_emails pour l'adresse et le contexte.",
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
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "to", "subject", "bodyText", "userConfirmed"],
    },
  },
];

export const CHATBOT_WRITE_TOOLS = new Set([
  "update_intervention_status",
  "assign_technician",
  "update_intervention_schedule",
  "add_timeline_comment",
  "send_intervention_email",
]);

export function isChatbotWriteTool(name: string): boolean {
  return CHATBOT_WRITE_TOOLS.has(name);
}
