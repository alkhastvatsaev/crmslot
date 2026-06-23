import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import type { Intervention } from "@/features/interventions";
import { assertTechnicianMayUpdateAssignedIntervention } from "@/features/interventions/technicianAssignmentServerAuth";
import { canTechnicianAmendCompletionReport } from "@/features/interventions/technicianCompletionReport";
import { canTechnicianAmendInvoicedReport } from "@/features/interventions/technicianInvoicedReportAmend";
import { technicianAmendInvoicedReportAdmin } from "@/features/interventions/index.server";
import { coerceAdminExtraPatch } from "@/features/interventions/index.server";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = {
  completionPhotoUrls?: string[];
  completionSignatureUrl?: string;
  billingLines?: {
    description: string;
    quantity: number;
    unitPriceCents: number;
    reference?: string;
  }[];
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
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
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

  const isInvoiced = iv.status === "invoiced";
  const gate = isInvoiced
    ? canTechnicianAmendInvoicedReport(iv, auth.uid)
    : canTechnicianAmendCompletionReport(iv, auth.uid);
  if (!gate.allowed) {
    return NextResponse.json(
      { ok: false, error: `Modification refusée (${gate.reason})` },
      { status: 403 }
    );
  }

  const extraPatch = coerceAdminExtraPatch({
    completionPhotoUrls: body.completionPhotoUrls,
    completionSignatureUrl: body.completionSignatureUrl,
    billingLines: body.billingLines,
    statusUpdatedAt: new Date().toISOString(),
  });

  try {
    if (isInvoiced) {
      await technicianAmendInvoicedReportAdmin({
        db,
        interventionId,
        actorUid: auth.uid,
        patch: extraPatch ?? {},
      });
    } else {
      await db
        .collection("interventions")
        .doc(interventionId)
        .update(extraPatch ?? {});
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("[interventions/completion-amend]", {
      error: e instanceof Error ? e.message : String(e),
    });
    const message = e instanceof Error ? e.message : "Erreur mise à jour";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
