import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { assertTechnicianMayUpdateAssignedIntervention } from "@/features/interventions/technicianAssignmentServerAuth";
import { assertCanAssignInterventionServer } from "@/features/backoffice";
import type { Intervention } from "@/features/interventions";
import { requestInterventionInvoiceReviewAdmin } from "@/features/interventions/index.server";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = {
  note?: string;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const interventionId = id?.trim();
  if (!interventionId) {
    return NextResponse.json(
      { ok: false, error: "Identifiant intervention manquant." },
      { status: 400 }
    );
  }

  let body: Body = {};
  try {
    const raw = await request.text();
    if (raw.trim()) body = JSON.parse(raw) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const db = admin.firestore();
  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) {
    return NextResponse.json({ ok: false, error: "Intervention introuvable." }, { status: 404 });
  }

  const iv = { id: snap.id, ...snap.data() } as Intervention;
  const companyId = String(iv.companyId ?? "").trim();
  const isTechnician = assertTechnicianMayUpdateAssignedIntervention(iv, auth.uid);
  const isDispatcher =
    companyId && (await assertCanAssignInterventionServer(db, auth.uid, companyId, auth.decoded));

  if (!isTechnician && !isDispatcher) {
    return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 403 });
  }

  try {
    await requestInterventionInvoiceReviewAdmin({
      db,
      interventionId,
      actorUid: auth.uid,
      note: typeof body.note === "string" ? body.note : "",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("[request-invoice-review]", {
      error: e instanceof Error ? e.message : String(e),
    });
    const message = e instanceof Error ? e.message : "Transmission dispatcher impossible";
    const status = message.includes("clôture") ? 409 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
