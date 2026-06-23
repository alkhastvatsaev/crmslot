import type { ChatbotToolDefinition } from "@/features/chatbot/chatbot-tools-types";

/** Outils lecture seule — workspace, CRM, dossiers, stats. */
export const CHATBOT_READ_TOOL_DEFINITIONS: ChatbotToolDefinition[] = [
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
    description: "Liste les interventions de la société active avec filtres optionnels.",
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
    description:
      "Emails liés à une intervention (fil Firestore / dossier — pas la boîte Gmail globale).",
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
      "Facturation d'une intervention : lignes, montants, statut paiement, PDF facture. Utilise search_workspace ou list_interventions pour trouver l'id dossier si l'utilisateur cite un nom (ex. Vatsaev).",
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
    description: "Messages chat portail client (entreprise) — société ou dossier précis.",
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
    name: "list_supplier_orders",
    description:
      "Liste les commandes fournisseur (Lecot, etc.) de la société, avec statut et détail des lignes.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max 20, défaut 10" },
        interventionId: { type: "string", description: "Filtrer par dossier (optionnel)" },
      },
    },
  },
  {
    name: "list_company_material_orders",
    description:
      "Liste les bons matériel de la société (tous dossiers). Filtre optionnel status=pending|ordered|delivered|… — idéal pour valider en masse.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "pending | approved | ordered | delivered | received | cancelled",
        },
        limit: { type: "number", description: "Max 40, défaut 20" },
      },
    },
  },
  {
    name: "list_vehicle_stock",
    description:
      "Liste tous les articles du stock véhicule du technicien (quantités, seuils, alertes stock bas). Appeler en premier pour connaître les IDs avant toute mise à jour.",
    input_schema: { type: "object", properties: {} },
  },
];
