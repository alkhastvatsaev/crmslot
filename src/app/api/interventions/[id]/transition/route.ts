import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import type { Intervention } from "@/features/interventions";
import { assertTechnicianMayUpdateAssignedIntervention } from "@/features/interventions/technicianAssignmentServerAuth";
import { actorMayTransition } from "@/features/interventions/workflow/interventionWorkflow";
import { coerceAdminExtraPatch } from "@/features/interventions/workflow/coerceAdminExtraPatch";
import { transitionInterventionStatusAdmin } from "@/features/interventions/workflow/transitionInterventionStatusAdmin";
import { technicianTransitionActor } from "@/features/interventions/workflow/workflowActor";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = {
  toStatus?: Intervention["status"];
  note?: string;
  extraPatch?: Record<string, unknown>;
};

function isPlainExtraPatch(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

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

  const toStatus = body.toStatus;
  if (!toStatus || typeof toStatus !== "string") {
    return NextResponse.json({ ok: false, error: "toStatus requis." }, { status: 400 });
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

  const actor = technicianTransitionActor(auth.uid);
  if (!actorMayTransition(actor, iv.status, toStatus)) {
    return NextResponse.json(
      { ok: false, error: `Transition interdite : ${iv.status} → ${toStatus}` },
      { status: 403 }
    );
  }

  const extraPatch = isPlainExtraPatch(body.extraPatch)
    ? coerceAdminExtraPatch(body.extraPatch)
    : undefined;

  try {
    await transitionInterventionStatusAdmin({
      db,
      interventionId,
      iv,
      toStatus,
      actor,
      note: body.note?.trim() || undefined,
      extraPatch,
      writeInboxAlerts: false,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("[interventions/transition]", {
      error: e instanceof Error ? e.message : String(e),
    });
    const message = e instanceof Error ? e.message : "Erreur transition";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
