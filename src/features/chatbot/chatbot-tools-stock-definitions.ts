import type { ChatbotToolDefinition } from "@/features/chatbot/chatbot-tools-types";

/** Outils stock véhicule + focus inventaire matériel. */
export const CHATBOT_STOCK_TOOL_DEFINITIONS: ChatbotToolDefinition[] = [
  {
    name: "focus_stock_item",
    description:
      "Met en avant un article stock dans l'UI Matériel (sélection + filtre optionnel low|orders|lecot).",
    input_schema: {
      type: "object",
      properties: {
        stockItemId: { type: "string" },
        filter: { type: "string", enum: ["all", "low", "orders", "lecot"] },
        searchQuery: { type: "string", description: "Pré-remplit la recherche inventaire" },
      },
    },
  },
  {
    name: "add_vehicle_stock_item",
    description:
      "Ajoute un nouvel article au stock véhicule du technicien (SKU, libellé, quantité, seuil, prix).",
    input_schema: {
      type: "object",
      properties: {
        sku: { type: "string", description: "Référence article (ex. SKU123)" },
        label: { type: "string", description: "Nom de l'article (ex. Cylindre A2P)" },
        quantity: { type: "number", description: "Quantité initiale" },
        minQuantity: { type: "number", description: "Seuil d'alerte stock bas (défaut 1)" },
        unitPriceCents: { type: "number", description: "Prix unitaire en centimes (défaut 0)" },
      },
      required: ["sku", "label", "quantity"],
    },
  },
  {
    name: "update_vehicle_stock_item",
    description:
      "Met à jour un article du stock véhicule : ajuster la quantité par delta (+2 / -1) ou valeur absolue, ou modifier le libellé / seuil / prix. Appeler list_vehicle_stock d'abord pour obtenir l'itemId.",
    input_schema: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "ID de l'article (obtenu via list_vehicle_stock)" },
        quantityDelta: { type: "number", description: "Variation de quantité (+1, -2, …)" },
        quantity: {
          type: "number",
          description: "Nouvelle quantité absolue (remplace quantityDelta si présent)",
        },
        label: { type: "string", description: "Nouveau libellé (optionnel)" },
        minQuantity: { type: "number", description: "Nouveau seuil d'alerte (optionnel)" },
        unitPriceCents: {
          type: "number",
          description: "Nouveau prix unitaire en centimes (optionnel)",
        },
      },
      required: ["itemId"],
    },
  },
];
