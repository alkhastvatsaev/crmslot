import { getAdminDb } from "@/core/config/firebase-admin";
import { logger } from "@/core/logger";
import { Type, FunctionDeclaration } from "@google/genai";

export const chatbotToolsGemini: FunctionDeclaration[] = [
  {
    name: "search_clients",
    description: "Recherche un client dans la base de données (CRM) par nom, adresse ou email.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Nom, adresse ou email partiel du client à rechercher.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_active_interventions",
    description:
      "Récupère la liste des interventions/dépannages qui ne sont pas terminées aujourd'hui ou en attente.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        dummy: { type: Type.STRING, description: "Paramètre optionnel" }, // Gemini requiert un schema objet
      },
    },
  },
  {
    name: "get_pending_quotes",
    description: "Récupère la liste des devis en attente de signature ou validation.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        dummy: { type: Type.STRING, description: "Paramètre optionnel" },
      },
    },
  },
  {
    name: "create_intervention",
    description:
      "Crée une nouvelle intervention (dépannage ou chantier). DEMANDER TOUJOURS UNE CONFIRMATION AVANT D'APPELER CET OUTIL.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        clientName: { type: Type.STRING },
        address: { type: Type.STRING },
        title: { type: Type.STRING, description: "Résumé court du problème" },
        urgency: { type: Type.STRING, description: "Urgence : normale ou urgente" },
      },
      required: ["clientName", "address", "title", "urgency"],
    },
  },
  {
    name: "check_stock",
    description: "Vérifie la disponibilité d'une pièce ou de matériel dans le stock.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemName: {
          type: Type.STRING,
          description: "Nom de la pièce (ex: cylindre, serrure multipoint)",
        },
      },
      required: ["itemName"],
    },
  },
];

export async function executeChatbotTool(
  toolName: string,
  input: Record<string, unknown>,
  companyId: string
) {
  const db = getAdminDb();

  try {
    switch (toolName) {
      case "search_clients": {
        const snap = await db
          .collection("clients")
          .where("companyId", "==", companyId)
          .orderBy("createdAt", "desc")
          .limit(50)
          .get();
        const query = (typeof input.query === "string" ? input.query : "").toLowerCase();
        const results = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter(
            (c: Record<string, unknown>) =>
              (typeof c.name === "string" && c.name.toLowerCase().includes(query)) ||
              (typeof c.email === "string" && c.email.toLowerCase().includes(query)) ||
              (typeof c.address === "string" && c.address.toLowerCase().includes(query))
          );
        return results.length > 0 ? results.slice(0, 5) : { message: "Aucun client trouvé." };
      }

      case "get_active_interventions": {
        const snap = await db
          .collection("interventions")
          .where("companyId", "==", companyId)
          .where("status", "in", ["pending", "in-progress", "assigned"])
          .limit(20)
          .get();
        return snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title,
            status: data.status,
            clientName: data.clientName,
            urgency: data.urgency,
          };
        });
      }

      case "get_pending_quotes": {
        const snap = await db
          .collection("companies")
          .doc(companyId)
          .collection("quotes")
          .where("status", "==", "draft")
          .limit(10)
          .get();
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }

      case "create_intervention": {
        const ref = await db.collection("interventions").add({
          companyId,
          ...input,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return {
          success: true,
          interventionId: ref.id,
          message: "Intervention créée avec succès.",
        };
      }

      case "check_stock": {
        const snap = await db
          .collection("stock")
          .where("companyId", "==", companyId)
          .limit(50)
          .get();
        const query = (typeof input.itemName === "string" ? input.itemName : "").toLowerCase();
        const results = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s: Record<string, unknown>) =>
            (typeof s.description === "string" ? s.description : "").toLowerCase().includes(query)
          );
        return results.length > 0 ? results : { message: "Pièce introuvable en stock." };
      }

      default:
        return { error: `Tool inconnu: ${toolName}` };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    logger.error("Erreur exécution tool Chatbot", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { error: errorMsg };
  }
}
