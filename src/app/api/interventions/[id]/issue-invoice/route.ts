import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { assertTechnicianMayUpdateAssignedIntervention } from "@/features/interventions/technicianAssignmentServerAuth";
import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";
import type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";
import { issueInterventionInvoiceAdmin } from "@/features/interventions/server/issueInterventionInvoiceAdmin";
import type { Intervention } from "@/features/interventions/types";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = {
  sendEmail?: boolean;
  billingLines?: DraftBillingLine[];
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
    const result = await issueInterventionInvoiceAdmin({
      db,
      interventionId,
      actorUid: auth.uid,
      sendEmail: body.sendEmail !== false,
      billingLinesOverride: Array.isArray(body.billingLines) ? body.billingLines : undefined,
      actorRole: isTechnician ? "technician" : "dispatcher",
      transitionNote: isTechnician
        ? "Facture émise par le technicien terrain"
        : "Facture émise par le back-office",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logger.error("[issue-invoice]", { error: e instanceof Error ? e.message : String(e) });
    const message = e instanceof Error ? e.message : "Émission facture impossible";
    const status = message.includes("statut") ? 409 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
