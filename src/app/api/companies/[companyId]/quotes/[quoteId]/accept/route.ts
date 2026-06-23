import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { assertCanAssignInterventionServer } from "@/features/backoffice";
import { acceptQuoteAdmin } from "@/features/quotes";

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

  try {
    const result = await acceptQuoteAdmin({
      db,
      companyId: cid,
      quoteId: qid,
      actorUid: auth.uid,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Acceptation impossible";
    const status = message.includes("introuvable") ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
