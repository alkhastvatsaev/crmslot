import "@/core/config/firebase-admin";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { getAdminDb, isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { assertCanAssignInterventionServer } from "@/features/backoffice";
import { dispatchCompanyWebhooksAdmin } from "@/features/integrations/index.server";
import type { Intervention } from "@/features/interventions";

export const runtime = "nodejs";

type Body = {
  fromStatus?: Intervention["status"];
  toStatus?: Intervention["status"];
  at?: string;
};

/** POST — déclenche les webhooks sortants après transition client Firestore. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;
  if (!isFirebaseAdminReady()) {
    return NextResponse.json(
      { ok: false, error: "Firebase Admin not configured" },
      { status: 503 }
    );
  }

  const { id: interventionId } = await context.params;
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const fromStatus = body.fromStatus;
  const toStatus = body.toStatus;
  if (!fromStatus || !toStatus || fromStatus === toStatus) {
    return NextResponse.json({ ok: false, error: "Invalid status transition" }, { status: 400 });
  }

  const db = getAdminDb();
  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const iv = { id: snap.id, ...snap.data() } as Intervention;
  const companyId = iv.companyId?.trim() ?? "";
  if (!companyId) {
    return NextResponse.json({ ok: false, error: "companyId manquant" }, { status: 400 });
  }

  const allowed = await assertCanAssignInterventionServer(
    db,
    auth.decoded.uid,
    companyId,
    auth.decoded
  );
  if (!allowed) {
    const isActor =
      iv.assignedTechnicianUid === auth.decoded.uid || iv.createdByUid === auth.decoded.uid;
    if (!isActor) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
  }

  const at = body.at?.trim() || new Date().toISOString();
  const delivered = await dispatchCompanyWebhooksAdmin(companyId, "intervention.status_changed", {
    interventionId,
    at,
    data: { fromStatus, toStatus },
  });

  return NextResponse.json({ ok: true, delivered });
}
