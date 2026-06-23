import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import type { Intervention } from "@/features/interventions";
import {
  acceptTechnicianAssignmentInProgressPatch,
  acceptTechnicianAssignmentPatch,
  declineTechnicianAssignmentPatch,
} from "@/features/interventions/technicianAssignmentActions";
import { assertTechnicianMayRespondToAssignment } from "@/features/interventions/technicianAssignmentServerAuth";
import { transitionInterventionStatusAdmin } from "@/features/interventions/index.server";
import { technicianTransitionActor } from "@/features/interventions/workflow/workflowActor";
import { notifyCompanyAdminsPush } from "@/features/notifications/index.server";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = {
  action?: "accept" | "decline";
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

  const action = body.action;
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json(
      { ok: false, error: "action doit être accept ou decline." },
      { status: 400 }
    );
  }

  const db = admin.firestore();
  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) {
    return NextResponse.json({ ok: false, error: "Intervention introuvable." }, { status: 404 });
  }

  const iv = { id: snap.id, ...snap.data() } as Intervention;
  if (!assertTechnicianMayRespondToAssignment(iv, auth.uid)) {
    return NextResponse.json(
      { ok: false, error: "Mission non assignée à ce technicien." },
      { status: 403 }
    );
  }

  const actor = technicianTransitionActor(auth.uid);

  try {
    if (action === "accept") {
      if (iv.status === "assigned") {
        await transitionInterventionStatusAdmin({
          db,
          interventionId,
          iv,
          toStatus: "en_route",
          actor,
          extraPatch: acceptTechnicianAssignmentPatch(),
          writeInboxAlerts: false,
        });
      } else if (iv.status === "in_progress" && !iv.technicianAcceptedAt) {
        await db
          .collection("interventions")
          .doc(interventionId)
          .update({
            ...acceptTechnicianAssignmentInProgressPatch(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      } else {
        return NextResponse.json(
          { ok: false, error: "Cette mission n'attend plus de réponse." },
          { status: 409 }
        );
      }
    } else {
      const declinePatch = declineTechnicianAssignmentPatch(
        (iv.assignedTechnicianUid ?? auth.uid).trim()
      );
      if (iv.status === "assigned") {
        await transitionInterventionStatusAdmin({
          db,
          interventionId,
          iv,
          toStatus: "pending",
          actor,
          extraPatch: declinePatch,
          writeInboxAlerts: false,
        });
      } else if (iv.status === "in_progress" && !iv.technicianAcceptedAt) {
        await db
          .collection("interventions")
          .doc(interventionId)
          .update({
            ...declinePatch,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      } else {
        return NextResponse.json(
          { ok: false, error: "Cette mission n'attend plus de réponse." },
          { status: 409 }
        );
      }

      // Refus mission tech → admin doit réassigner. Push urgent.
      const companyId = (iv.companyId ?? "").trim();
      if (companyId) {
        const title = (iv.title || iv.problem || `Dossier #${interventionId.slice(-8)}`).trim();
        void notifyCompanyAdminsPush({
          companyId,
          title: "Mission refusée par tech",
          body: `${title} — à réassigner`,
          data: {
            type: "technician_declined",
            bmInterventionId: interventionId,
          },
        }).catch(() => {});
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("[interventions/technician-response]", {
      error: e instanceof Error ? e.message : String(e),
    });
    const message = e instanceof Error ? e.message : "Erreur réponse technicien";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
