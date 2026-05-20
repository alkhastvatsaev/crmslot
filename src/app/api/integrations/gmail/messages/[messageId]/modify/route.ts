import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserOrLocalDev } from "@/core/api/routeAuth";
import { createGmailApiClient } from "@/core/services/email/gmailApiClient";
import { isGmailOAuthConfigured } from "@/core/services/email/gmailOAuthConfig";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ messageId: string }> };

/** Modifie les libellés d'un message (lu, étoile, corbeille, etc.). */
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const addLabelIds = Array.isArray((body as { addLabelIds?: unknown }).addLabelIds)
    ? ((body as { addLabelIds: unknown[] }).addLabelIds.filter((x) => typeof x === "string") as string[])
    : [];
  const removeLabelIds = Array.isArray((body as { removeLabelIds?: unknown }).removeLabelIds)
    ? ((body as { removeLabelIds: unknown[] }).removeLabelIds.filter((x) => typeof x === "string") as string[])
    : [];

  if (addLabelIds.length === 0 && removeLabelIds.length === 0) {
    return NextResponse.json({ error: "addLabelIds ou removeLabelIds requis." }, { status: 400 });
  }

  try {
    const gmail = await createGmailApiClient();
    const res = await gmail.users.messages.modify({
      userId: "me",
      id,
      requestBody: { addLabelIds, removeLabelIds },
    });
    return NextResponse.json({
      ok: true,
      labelIds: res.data.labelIds ?? [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Modification impossible.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
