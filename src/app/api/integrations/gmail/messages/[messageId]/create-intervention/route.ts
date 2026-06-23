import { NextResponse } from "next/server";
import { requireAuthenticatedUserOrLocalDev } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { isGmailOAuthConfigured } from "@/core/services/email/gmailOAuthConfig";
import { createInterventionFromGmailAdmin } from "@/features/gmail/index.server";
import { verifyGmailRouteCompanyAccess } from "@/features/gmail/gmailRouteCompany";

export const runtime = "nodejs";

type Body = { companyId?: string; autoAssign?: boolean };

/** POST — crée un dossier + assignation IA depuis un e-mail Gmail. */
export async function POST(request: Request, context: { params: Promise<{ messageId: string }> }) {
  const auth = await requireAuthenticatedUserOrLocalDev(request);
  if ("response" in auth) return auth.response;

  if (!(await isGmailOAuthConfigured())) {
    return NextResponse.json({ error: "Gmail OAuth non configuré." }, { status: 503 });
  }

  const { messageId } = await context.params;
  const id = messageId?.trim();
  if (!id) {
    return NextResponse.json({ error: "messageId requis." }, { status: 400 });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const companyId = body.companyId?.trim() ?? "";
  if (!companyId) {
    return NextResponse.json({ error: "companyId requis." }, { status: 400 });
  }

  if (!(await verifyGmailRouteCompanyAccess(auth.uid, companyId))) {
    return NextResponse.json({ error: "Accès société refusé." }, { status: 403 });
  }

  try {
    const result = await createInterventionFromGmailAdmin({
      db: getAdminDb(),
      companyId,
      messageId: id,
      actorUid: auth.uid,
      autoAssign: body.autoAssign !== false,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Création impossible.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
