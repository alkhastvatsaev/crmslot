import { getAdminDb, isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { logger } from "@/core/logger";

export type ChatbotLogEntry = {
  companyId: string;
  role: string | null;
  actorUid: string;
  createdAt: number;
  messages: unknown[]; // Full array of messages up to this point
  apiMessages: unknown[]; // New array of messages returned by OpenAI including assistant reply
  systemPrompt?: string; // Optional: save system prompt for fully reproducible state
};

export async function logChatbotTurn(entry: ChatbotLogEntry): Promise<void> {
  if (!isFirebaseAdminReady()) {
    logger.warn("[chatbot-logger] Firebase Admin non initialisé, log ignoré.");
    return;
  }

  try {
    const db = getAdminDb();
    await db
      .collection("companies")
      .doc(entry.companyId)
      .collection("chatbot_training_logs")
      .add({
        ...entry,
        createdAtIso: new Date(entry.createdAt).toISOString(),
      });
  } catch (error) {
    logger.error("[chatbot-logger] Erreur lors de l'enregistrement du log", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
