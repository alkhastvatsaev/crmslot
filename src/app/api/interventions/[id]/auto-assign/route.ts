import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { assertCanAssignInterventionServer } from "@/features/backoffice";
import { autoAssignBestTechnicianAdmin } from "@/features/dispatch";
import type { Intervention } from "@/features/interventions";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

/** POST — assigne le technicien le plus proche (dispatch IA). */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const interventionId = id?.trim();
  if (!interventionId) {
    return NextResponse.json({ ok: false, error: "Identifiant manquant." }, { status: 400 });
  }

  const db = admin.firestore();
  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) {
    return NextResponse.json({ ok: false, error: "Intervention introuvable." }, { status: 404 });
  }

  const iv = { id: snap.id, ...snap.data() } as Intervention;
  const companyId = (iv.companyId ?? "").trim();
  if (!companyId) {
    return NextResponse.json({ ok: false, error: "Société manquante." }, { status: 400 });
  }

  const allowed = await assertCanAssignInterventionServer(db, auth.uid, companyId, auth.decoded);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 403 });
  }

  try {
    const result = await autoAssignBestTechnicianAdmin({
      db,
      interventionId,
      iv,
      actorUid: auth.uid,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logger.error("[interventions/auto-assign]", {
      error: e instanceof Error ? e.message : String(e),
    });
    const message = e instanceof Error ? e.message : "Assignation IA impossible";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
