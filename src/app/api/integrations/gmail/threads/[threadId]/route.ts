import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserOrLocalDev } from "@/core/api/routeAuth";
import { createGmailApiClient } from "@/core/services/email/gmailApiClient";
import { isGmailOAuthConfigured } from "@/core/services/email/gmailOAuthConfig";
import { mapGmailMessageDetail } from "@/features/gmail/gmailHubMappers";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ threadId: string }> };

/** Conversation Gmail complète (threadId). */
export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await requireAuthenticatedUserOrLocalDev(req);
  if ("response" in auth) return auth.response;

  if (!(await isGmailOAuthConfigured())) {
    return NextResponse.json({ error: "Gmail OAuth non configuré." }, { status: 503 });
  }

  const { threadId } = await context.params;
  const id = threadId?.trim();
  if (!id) {
    return NextResponse.json({ error: "threadId requis." }, { status: 400 });
  }

  try {
    const gmail = await createGmailApiClient();
    const res = await gmail.users.threads.get({
      userId: "me",
      id,
      format: "full",
    });
    const raw = res.data.messages ?? [];
    const messages = raw
      .map(mapGmailMessageDetail)
      .filter((m) => m.id)
      .sort((a, b) => parseMailDate(a.date) - parseMailDate(b.date));

    return NextResponse.json({ threadId: id, messages });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Fil de discussion introuvable.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

function parseMailDate(raw: string): number {
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}
