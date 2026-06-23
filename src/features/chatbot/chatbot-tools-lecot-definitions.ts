import type { ChatbotToolDefinition } from "@/features/chatbot/chatbot-tools-types";

/** Outils Lecot + commandes matériel / fournisseur. */
export const CHATBOT_LECOT_TOOL_DEFINITIONS: ChatbotToolDefinition[] = [
  {
    name: "search_lecot_products",
    description:
      "OBLIGATOIRE si l'utilisateur demande une pièce/outil ou demande des suggestions (ex. « perceuse », « 5 serrures »). Tu AS ACCÈS au catalogue via cet outil, ne dis jamais l'inverse. Recherche le catalogue Lecot (local + API) et renvoie des suggestions avec prix, sku. Ne renvoie pas l'utilisateur sur le site sans l'avoir appelé.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Terme de recherche en français (ex: perceuse, cylindre Yale, serrure multipoints)",
        },
        limit: {
          type: "number",
          description: "Nombre max de résultats (défaut 3 pour proposer un choix)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "order_lecot_parts",
    description:
      "Crée une commande fournisseur Lecot. IMPORTANT : reprendre sku + unitPriceEur (ou unitPriceCents) EXACTEMENT depuis search_lecot_products. Quantité : toujours 1 par défaut — ne jamais demander la quantité à l'utilisateur. NE PAS inclure userConfirmed : confirmation via l'interface.",
    input_schema: {
      type: "object",
      properties: {
        lines: {
          type: "array",
          description:
            "Lignes de commande — reprendre sku et unitPriceEur depuis search_lecot_products",
          items: {
            type: "object",
            properties: {
              sku: {
                type: "string",
                description:
                  "Référence SKU du catalogue (ex. LEC-SER-1001) — copier depuis search_lecot_products",
              },
              label: {
                type: "string",
                description: "Libellé exact du produit — copier depuis search_lecot_products",
              },
              quantity: {
                type: "number",
                description:
                  "Quantité (mets toujours 1 par défaut, ne demande jamais à l'utilisateur)",
              },
              unitPriceEur: {
                type: "number",
                description:
                  "OBLIGATOIRE — prix unitaire HT en euros depuis search_lecot_products (ex. 145.00)",
              },
              unitPriceCents: {
                type: "number",
                description: "Alternative : prix unitaire HT en centimes (ex. 14500 = 145 €)",
              },
              imageUrl: {
                type: "string",
                description:
                  "URL vignette produit — copier depuis search_lecot_products si disponible",
              },
            },
            required: ["label", "unitPriceEur"],
          },
        },
        interventionId: {
          type: "string",
          description:
            "ID dossier lié — crée bon matériel + enregistre commande PWA + ajoute lignes à la facture",
        },
        syncBilling: {
          type: "boolean",
          description: "Ajouter les lignes à la facture dossier (défaut true si interventionId)",
        },
        notes: { type: "string", description: "Notes internes (optionnel)" },
        clientName: {
          type: "string",
          description:
            "Nom du client affiché dans le panneau Commandes (obligatoire sur la page Matériel avant toute commande Lecot)",
        },
      },
      required: ["lines"],
    },
  },
  {
    name: "approve_material_orders",
    description:
      "Valide des demandes matériel terrain (pending → ordered). orderIds OU approveAllPending=true. userConfirmed=true obligatoire.",
    input_schema: {
      type: "object",
      properties: {
        orderIds: {
          type: "array",
          items: { type: "string" },
          description: "IDs bons matériel à approuver",
        },
        approveAllPending: {
          type: "boolean",
          description: "Approuver toutes les demandes pending de la société (max 15)",
        },
        userConfirmed: { type: "boolean" },
      },
      required: ["userConfirmed"],
    },
  },
];
