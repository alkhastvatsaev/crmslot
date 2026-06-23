import type { ChatbotToolDefinition } from "@/features/chatbot/chatbot-tools-types";

/** Outils facturation + navigation hub facturation / exports. */
export const CHATBOT_BILLING_TOOL_DEFINITIONS: ChatbotToolDefinition[] = [
  {
    name: "patch_intervention_billing",
    description:
      "Modifie une ligne de facturation (prix unitPriceEur, quantité, description, clientName). La PWA affiche le PDF facture à droite — tu ne génères jamais le PDF. Préférer pour changer un prix. workflow : search_workspace si besoin → get_intervention_billing → patch. userConfirmed=true obligatoire (ou confirmation UI si false).",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        lineIndex: { type: "number", description: "Index ligne (défaut 0)" },
        unitPriceEur: { type: "number", description: "Prix unitaire en euros (ex. 500)" },
        unitPriceCents: { type: "number", description: "Alternative en centimes" },
        quantity: { type: "number" },
        description: { type: "string" },
        clientName: { type: "string", description: "Nom client sur la facture PDF" },
        previewDocumentType: { type: "string", enum: ["quote", "invoice"] },
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "userConfirmed"],
    },
  },
  {
    name: "update_intervention_billing",
    description:
      "Remplace toutes les lignes de facturation (unitPriceCents en centimes). La PWA génère le PDF. userConfirmed=true obligatoire.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        clientName: { type: "string" },
        clientAddress: { type: "string" },
        billingLines: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              quantity: { type: "number" },
              unitPriceCents: { type: "number" },
              reference: { type: "string" },
            },
            required: ["description", "quantity", "unitPriceCents"],
          },
        },
        previewDocumentType: { type: "string", enum: ["quote", "invoice"] },
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "billingLines", "userConfirmed"],
    },
  },
  {
    name: "focus_intervention_document",
    description:
      "Affiche le PDF à droite (devis, facture, rapport) sans modifier Firestore. Après patch_intervention_billing le PDF s'affiche déjà — ne pas rappeler.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        documentType: {
          type: "string",
          enum: ["quote", "invoice", "report"],
        },
      },
      required: ["interventionId", "documentType"],
    },
  },
  {
    name: "trigger_accounting_export",
    description:
      "Déclenche le téléchargement du fichier CSV d'export comptable (toutes les interventions facturées de la période). Utiliser quand l'utilisateur demande l'export comptable, le CSV de facturation ou l'export pour le comptable.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "trigger_payroll_export",
    description:
      "Déclenche le téléchargement du CSV des feuilles de temps (pointages techniciens). Utiliser quand l'utilisateur demande l'export paie, les feuilles de temps ou le fichier RH.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "focus_billing_case",
    description:
      "Sélectionne un dossier dans la liste facturation et applique un filtre (unpaid, to_bill, paid, all).",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        filter: { type: "string", enum: ["all", "unpaid", "pending", "paid", "to_bill"] },
      },
    },
  },
  {
    name: "open_crm_dossier",
    description:
      "Ouvre le dossier dans le dispatcher (hub interventions) pour suivi détaillé après analyse historique.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
      },
      required: ["interventionId"],
    },
  },
];
