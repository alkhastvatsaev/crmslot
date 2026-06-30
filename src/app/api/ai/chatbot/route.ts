import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { assertCompanyStaffAccess } from "@/features/company/server/assertCompanyStaffAccess";
import { handleChatbotPost, type ChatbotPostBody } from "@/features/chatbot/chatbot-route-handler";
import { ChatbotPostRequestSchema } from "@/core/api/schemas/chatbot";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;

  const raw = await req.json().catch(() => null);
  const parsed = ChatbotPostRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload invalide",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }
  const body = parsed.data as ChatbotPostBody;
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
