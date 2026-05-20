import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserOrLocalDev } from "@/core/api/routeAuth";
import { isGmailOAuthConfigured } from "@/core/services/email/gmailOAuthConfig";
import { linkGmailToIntervention } from "@/features/chatbot/chatbot-gmail";
import { verifyGmailRouteCompanyAccess } from "@/features/gmail/gmailRouteCompany";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ messageId: string }> };

/** Lie un mail Gmail à une intervention (timeline_events). */
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

  const companyId =
    typeof (body as { companyId?: string }).companyId === "string"
      ? (body as { companyId: string }).companyId.trim()
      : "";
  const interventionId =
    typeof (body as { interventionId?: string }).interventionId === "string"
      ? (body as { interventionId: string }).interventionId.trim()
      : "";
  const note =
    typeof (body as { note?: string }).note === "string"
      ? (body as { note: string }).note.trim()
      : undefined;

  if (!companyId || !interventionId) {
    return NextResponse.json({ error: "companyId et interventionId requis." }, { status: 400 });
  }

  if (!(await verifyGmailRouteCompanyAccess(auth.uid, companyId))) {
    return NextResponse.json({ error: "Accès société refusé." }, { status: 403 });
  }

  try {
    const result = await linkGmailToIntervention(
      { companyId, actorUid: auth.uid },
      { messageId: id, interventionId, note },
    );
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Liaison impossible.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
