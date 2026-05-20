export type SerrAIToolDefinition = {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
};

/** Outils SerrAI — exécution serveur (Firebase Admin) ; écriture avec confirmation UI. */
export const SERRAI_TOOL_DEFINITIONS: SerrAIToolDefinition[] = [
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
    name: "list_clients",
    description: "Liste les clients CRM de la société.",
    input_schema: {
      type: "object",
      properties: {
        search: { type: "string" },
        limit: { type: "number" },
      },
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
];

export const SERRAI_WRITE_TOOLS = new Set([
  "update_intervention_status",
  "assign_technician",
  "update_intervention_schedule",
  "add_timeline_comment",
]);

export function isSerrAIWriteTool(name: string): boolean {
  return SERRAI_WRITE_TOOLS.has(name);
}
