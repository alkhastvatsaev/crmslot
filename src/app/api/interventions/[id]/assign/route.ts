import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { blockIfProduction, requireAuthenticatedUser } from "@/core/api/routeAuth";
import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";
import type { Intervention } from "@/features/interventions/types";
import { applyBackofficeTechnicianAssignmentAdmin } from "@/features/backoffice/applyBackofficeTechnicianAssignmentAdmin";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type AssignBody = {
  technicianUid?: string;
  scheduledDate?: string;
  scheduledTime?: string;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const blocked = blockIfProduction();
  if (blocked) return blocked;

  const { id } = await context.params;
  const interventionId = id?.trim();
  if (!interventionId) {
    return NextResponse.json(
      { ok: false, error: "Identifiant intervention manquant." },
      { status: 400 }
    );
  }

  let body: AssignBody = {};
  try {
    body = (await request.json()) as AssignBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const technicianUid = (body.technicianUid ?? "").trim();
  if (!technicianUid) {
    return NextResponse.json({ ok: false, error: "technicianUid requis." }, { status: 400 });
  }

  const db = admin.firestore();
  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) {
    return NextResponse.json({ ok: false, error: "Intervention introuvable." }, { status: 404 });
  }

  const iv = { id: snap.id, ...snap.data() } as Intervention;
  const companyId = (iv.companyId ?? "").trim();
  if (!companyId) {
    return NextResponse.json({ ok: false, error: "Intervention sans société." }, { status: 400 });
  }

  const allowed = await assertCanAssignInterventionServer(db, auth.uid, companyId, auth.decoded);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Permission refusée pour cette société." },
      { status: 403 }
    );
  }

  const schedule =
    body.scheduledDate?.trim() && body.scheduledTime?.trim()
      ? { scheduledDate: body.scheduledDate.trim(), scheduledTime: body.scheduledTime.trim() }
      : undefined;

  try {
    await applyBackofficeTechnicianAssignmentAdmin({
      db,
      interventionId,
      iv,
      technicianUid,
      actorUid: auth.uid,
      schedule,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("[interventions/assign]", { error: e instanceof Error ? e.message : String(e) });
    const message = e instanceof Error ? e.message : "Erreur assignation";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
