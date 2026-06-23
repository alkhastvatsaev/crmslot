import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserOrLocalDev } from "@/core/api/routeAuth";
import { createGmailApiClient } from "@/core/services/email/gmailApiClient";
import { isGmailOAuthConfigured } from "@/core/services/email/gmailOAuthConfig";
import { mapGmailMessageDetail } from "@/features/gmail";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ messageId: string }> };

/** Détail d'un message Gmail (corps + en-têtes). */
export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await requireAuthenticatedUserOrLocalDev(req);
  if ("response" in auth) return auth.response;

  if (!(await isGmailOAuthConfigured())) {
    return NextResponse.json({ error: "Gmail OAuth non configuré." }, { status: 503 });
  }

  const { messageId } = await context.params;
  const id = messageId?.trim();
  if (!id) {
    return NextResponse.json({ error: "messageId requis." }, { status: 400 });
  }

  try {
    const gmail = await createGmailApiClient();
    const res = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "full",
    });
    return NextResponse.json({ message: mapGmailMessageDetail(res.data) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Message introuvable.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
