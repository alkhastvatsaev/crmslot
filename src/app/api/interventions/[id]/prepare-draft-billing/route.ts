import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { assertTechnicianMayUpdateAssignedIntervention } from "@/features/interventions/technicianAssignmentServerAuth";
import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";
import type { Intervention } from "@/features/interventions/types";
import { prepareDraftBillingOnIntervention } from "@/features/interventions/server/prepareDraftBillingOnIntervention";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const interventionId = id?.trim();
  if (!interventionId) {
    return NextResponse.json({ ok: false, error: "Identifiant intervention manquant." }, { status: 400 });
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
    companyId &&
    (await assertCanAssignInterventionServer(db, auth.uid, companyId, auth.decoded));

  if (!isTechnician && !isDispatcher) {
    return NextResponse.json({ ok: false, error: "Accès refusé." }, { status: 403 });
  }

  try {
    const result = await prepareDraftBillingOnIntervention(db, interventionId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[prepare-draft-billing]", e);
    const message = e instanceof Error ? e.message : "Erreur préparation facture";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
