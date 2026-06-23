import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { assertCanAssignInterventionServer } from "@/features/backoffice";
import { sendQuoteEmailAdmin } from "@/features/quotes/index.server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ companyId: string; quoteId: string }> }
) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const { companyId, quoteId } = await context.params;
  const cid = companyId?.trim();
  const qid = quoteId?.trim();
  if (!cid || !qid) {
    return NextResponse.json({ ok: false, error: "Paramètres manquants." }, { status: 400 });
  }

  const db = getAdminDb();
  const allowed = await assertCanAssignInterventionServer(db, auth.uid, cid, auth.decoded);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 403 });
  }

  const result = await sendQuoteEmailAdmin({
    db,
    companyId: cid,
    quoteId: qid,
    sentByUid: auth.uid,
  });

  if (!result.ok) {
    const status = result.skipped ? 400 : 502;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json({ ok: true, emailSent: true });
}
