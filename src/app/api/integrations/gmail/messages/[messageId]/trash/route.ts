import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserOrLocalDev } from "@/core/api/routeAuth";
import { createGmailApiClient } from "@/core/services/email/gmailApiClient";
import { isGmailOAuthConfigured } from "@/core/services/email/gmailOAuthConfig";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ messageId: string }> };

/** Déplace un message vers la corbeille. */
export async function POST(req: NextRequest, context: RouteContext) {
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
    await gmail.users.messages.trash({ userId: "me", id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Suppression impossible.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
