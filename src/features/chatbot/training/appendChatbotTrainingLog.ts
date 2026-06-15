import { getAdminDb, isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { logger } from "@/core/logger";
import type { ChatbotTrainingTurnExtract } from "@/features/chatbot/training/extractChatbotTrainingTurn";
import * as admin from "firebase-admin";

const MAX_USER_CHARS = 12_000;
const MAX_ASSISTANT_CHARS = 48_000;

/** Opt-in : ne collecte rien tant que la variable n’est pas activée (RGPD / volume). */
export function isChatbotTrainingLogEnabled(): boolean {
  const v = process.env.CHATBOT_TRAINING_LOG_ENABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export type AppendChatbotTrainingLogParams = {
  companyId: string;
  actorUid: string;
  modelName: string;
  conversationId?: string | null;
  turn: ChatbotTrainingTurnExtract;
};

/**
 * Écrit un document dans `companies/{companyId}/chatbot_training_logs` (Admin SDK uniquement).
 * Ne bloque pas le flux SSE en cas d’erreur.
 */
export async function appendChatbotTrainingLog(
  params: AppendChatbotTrainingLogParams
): Promise<void> {
  if (!isChatbotTrainingLogEnabled()) return;
  if (!isFirebaseAdminReady()) return;

  const userMessage = params.turn.userMessage.slice(0, MAX_USER_CHARS);
  const assistantMessage = params.turn.assistantMessage.slice(0, MAX_ASSISTANT_CHARS);
  if (!userMessage.trim() || !assistantMessage.trim()) return;

  try {
    const db = getAdminDb();
    await db
      .collection("companies")
      .doc(params.companyId)
      .collection("chatbot_training_logs")
      .add({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        actorUid: params.actorUid,
        modelName: params.modelName,
        conversationId: (params.conversationId ?? "").trim() || null,
        userMessage,
        assistantMessage,
        hadToolRounds: params.turn.hadToolRounds,
        source: "crmslot_openai_chatbot",
      });
  } catch (err) {
    logger.error("[chatbot/training] appendChatbotTrainingLog:", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
