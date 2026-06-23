import { NextResponse } from "next/server";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { blockIfProduction } from "@/core/api/routeAuth";
import { parseMockSignRequestId } from "@/features/esign";

export const runtime = "nodejs";

type Body = {
  requestId?: string;
  status?: "signed" | "declined";
};

/**
 * Finalise une signature mock initiée depuis `/suivi/sign-mock` (portail public).
 * UNIQUEMENT en dev/preview : en production le vrai webhook signé `webhooks/esign` prend le relais.
 * Sans ce garde-fou, quiconque devine `interventionId` + `Date.now()` d'initiation peut
 * valider une signature légale sans authentification.
 */
export async function POST(request: Request) {
  const blocked = blockIfProduction();
  if (blocked) return blocked;

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const requestId = body.requestId?.trim();
  if (!requestId) {
    return NextResponse.json({ ok: false, error: "requestId requis" }, { status: 400 });
  }

  const interventionId = parseMockSignRequestId(requestId);
  if (!interventionId) {
    return NextResponse.json({ ok: false, error: "requestId invalide" }, { status: 400 });
  }

  const status = body.status === "declined" ? "declined" : "signed";
  const db = getAdminDb();
  const ref = db.collection("interventions").doc(interventionId);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ ok: false, error: "Intervention introuvable" }, { status: 404 });
  }

  const data = snap.data() ?? {};
  const storedRequestId =
    typeof data.remoteSignRequestId === "string" ? data.remoteSignRequestId.trim() : "";
  const remoteSignStatus = typeof data.remoteSignStatus === "string" ? data.remoteSignStatus : null;

  if (!storedRequestId || storedRequestId !== requestId) {
    return NextResponse.json(
      { ok: false, error: "Demande de signature invalide" },
      { status: 400 }
    );
  }
  if (remoteSignStatus !== "pending") {
    return NextResponse.json({ ok: false, error: "Signature déjà traitée" }, { status: 409 });
  }

  const at = new Date().toISOString();
  const companyId =
    typeof data.companyId === "string" && data.companyId.length > 0 ? data.companyId : null;

  await ref.update({
    remoteSignStatus: status,
    remoteSignatureUrl: `mock-signature://${interventionId}`,
    updatedAt: at,
  });

  await ref.collection("timeline_events").add({
    interventionId,
    type: "comment",
    content:
      status === "signed"
        ? "Rapport signé électroniquement par le client (mock)"
        : "Signature électronique refusée (mock)",
    visibility: "client",
    createdAt: at,
    createdByUid: "portal-mock-sign",
    companyId,
  });

  return NextResponse.json({ ok: true, status });
}
