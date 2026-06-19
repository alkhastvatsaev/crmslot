import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { assertCompanyStaffAccess } from "@/features/company/server/assertCompanyStaffAccess";
import { handleChatbotPost, type ChatbotPostBody } from "@/features/chatbot/chatbot-route-handler";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;

  const body = (await req.json().catch(() => null)) as ChatbotPostBody | null;
  const companyId = (body?.companyId ?? "").trim();
  const access = await assertCompanyStaffAccess(
    getAdminDb(),
    authResult.uid,
    companyId,
    authResult.decoded
  );
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  return handleChatbotPost(body, { uid: authResult.uid });
}
