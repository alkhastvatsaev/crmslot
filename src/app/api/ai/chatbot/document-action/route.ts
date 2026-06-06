import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import {
  handleChatbotDocumentActionPost,
  type ChatbotDocumentActionBody,
} from "@/features/chatbot/chatbot-document-action-handler";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser(req);
    if ("response" in authResult) return authResult.response;

    const body = (await req.json().catch(() => null)) as ChatbotDocumentActionBody | null;
    return await handleChatbotDocumentActionPost(body, { uid: authResult.uid });
  } catch (err: unknown) {
    logger.error("[chatbot/document-action]", {
      error: err instanceof Error ? err.message : String(err),
    });
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
