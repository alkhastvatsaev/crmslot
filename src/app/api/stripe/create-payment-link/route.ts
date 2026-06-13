import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";
import { createInterventionPaymentLinkAdmin } from "@/features/billing/server/createInterventionPaymentLinkAdmin";
import { stripeMockPaymentsEnabled } from "@/features/billing/stripeMockMode";
import { assertTechnicianMayUpdateAssignedIntervention } from "@/features/interventions/technicianAssignmentServerAuth";
import type { Intervention } from "@/features/interventions/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  const mockMode = !stripeSecret && stripeMockPaymentsEnabled();
  if (!stripeSecret && !mockMode) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  let body: { interventionId?: string };
  try {
    body = (await request.json()) as { interventionId?: string };
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const interventionId = body.interventionId?.trim();
  if (!interventionId) {
    return NextResponse.json({ error: "interventionId requis" }, { status: 400 });
  }

  const db = getAdminDb();
  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  }

  const iv = { id: snap.id, ...snap.data() } as Intervention;
  const companyId = String(iv.companyId ?? "").trim();
  const createdByUid = typeof iv.createdByUid === "string" ? iv.createdByUid : "";

  const isRequester = createdByUid === auth.uid;
  const isStaff =
    companyId && (await assertCanAssignInterventionServer(db, auth.uid, companyId, auth.decoded));
  const isTechnician = assertTechnicianMayUpdateAssignedIntervention(iv, auth.uid);

  if (!isRequester && !isStaff && !isTechnician) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const result = await createInterventionPaymentLinkAdmin({
      db,
      interventionId,
      actorUid: auth.uid,
      iv,
    });
    return NextResponse.json({
      url: result.url,
      paymentStatus: result.paymentStatus ?? "unpaid",
      mock: result.mock,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Création lien paiement impossible";
    const status = message.includes("statut") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
