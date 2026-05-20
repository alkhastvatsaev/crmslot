import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import {
  handleChatbotPost,
  type ChatbotPostBody,
} from "@/features/chatbot/chatbot-route-handler";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;

  const body = (await req.json().catch(() => null)) as ChatbotPostBody | null;
  return handleChatbotPost(body, { uid: authResult.uid });
}
