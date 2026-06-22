import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { assertTechnicianMayUpdateAssignedIntervention } from "@/features/interventions/technicianAssignmentServerAuth";
import type { Intervention } from "@/features/interventions/types";
import { sendInterventionInvoiceEmailToClient } from "@/features/interventions/server/interventionInvoiceEmail";

export const runtime = "nodejs";

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

  const db = admin.firestore();
  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) {
    return NextResponse.json({ ok: false, error: "Intervention introuvable." }, { status: 404 });
  }

  const iv = { id: snap.id, ...snap.data() } as Intervention;
  if (!assertTechnicianMayUpdateAssignedIntervention(iv, auth.uid)) {
    return NextResponse.json(
      { ok: false, error: "Mission non assignée à ce technicien." },
      { status: 403 }
    );
  }
  if (iv.status !== "invoiced") {
    return NextResponse.json(
      { ok: false, error: "La facture n’est pas encore validée par le dispatcher." },
      { status: 409 }
    );
  }
  if (!iv.invoicePdfUrl?.trim()) {
    return NextResponse.json({ ok: false, error: "PDF facture indisponible." }, { status: 409 });
  }

  const mail = await sendInterventionInvoiceEmailToClient({
    interventionId,
    iv,
    sentByUid: auth.uid,
  });
  if (!mail.ok) {
    return NextResponse.json(
      { ok: false, error: mail.error },
      { status: mail.skipped ? 400 : 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
