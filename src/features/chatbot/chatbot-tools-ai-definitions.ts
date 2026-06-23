import type { ChatbotToolDefinition } from "@/features/chatbot/chatbot-tools-types";

/** Outils IA — vision, clôture vocale, churn contrats. */
export const CHATBOT_AI_TOOL_DEFINITIONS: ChatbotToolDefinition[] = [
  {
    name: "diagnose_equipment_photo",
    description:
      "Analyse une photo d'équipement (serrure, chaudière, tableau électrique, etc.) via IA vision. " +
      "Identifie la marque/modèle, les défaillances probables, les étapes de réparation et les pièces à commander. " +
      "Utiliser quand le technicien envoie une URL de photo Firebase Storage ou https.",
    input_schema: {
      type: "object" as const,
      properties: {
        photoUrl: {
          type: "string",
          description:
            "URL publique ou signée de la photo (Firebase Storage https://... ou https://storage.googleapis.com/...)",
        },
        description: {
          type: "string",
          description:
            "Description optionnelle du technicien (symptômes observés, contexte d'intervention)",
        },
        interventionId: {
          type: "string",
          description: "ID du dossier d'intervention si le diagnostic doit être lié à un dossier",
        },
      },
      required: ["photoUrl"],
    },
  },
  {
    name: "parse_voice_job_closure",
    description:
      "Analyse la transcription vocale d'un technicien après une intervention et en extrait les données structurées : " +
      "lignes de facturation, rapport d'intervention, statut paiement, pièces utilisées, suites à donner. " +
      "Utiliser quand le technicien dicte son compte-rendu de clôture.",
    input_schema: {
      type: "object" as const,
      properties: {
        transcription: {
          type: "string",
          description: "Transcription brute de la dictée vocale du technicien",
        },
        interventionId: {
          type: "string",
          description: "ID du dossier d'intervention à clore (optionnel)",
        },
      },
      required: ["transcription"],
    },
  },
  {
    name: "get_contract_churn_risks",
    description:
      "Analyse les contrats de maintenance actifs et identifie les clients à risque de résiliation " +
      "(basé sur dépassements SLA, retards d'échéance, annulations, inactivité). " +
      "Retourne une liste triée par risque décroissant.",
    input_schema: {
      type: "object" as const,
      properties: {
        riskLevelFilter: {
          type: "string",
          enum: ["all", "at_risk", "watch", "safe"],
          description: "Filtrer par niveau de risque (défaut : all)",
        },
      },
      required: [],
    },
  },
];
