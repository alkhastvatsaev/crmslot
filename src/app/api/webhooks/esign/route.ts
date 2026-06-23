import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import "@/core/config/firebase-admin";
import { isProductionNodeEnv } from "@/core/api/routeAuth";
import { getAdminDb } from "@/core/config/firebase-admin";
import { notifyCompanyAdminsPush } from "@/features/notifications/index.server";

export const runtime = "nodejs";

function verifyEsignSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.ESIGN_WEBHOOK_SECRET?.trim();
  if (!secret) return !isProductionNodeEnv();
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** Webhook mock e-sign — marque l'intervention signée. */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-esign-signature");
  if (!verifyEsignSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    requestId?: string;
    interventionId?: string;
    status?: "signed" | "declined";
    signatureUrl?: string;
  };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const interventionId = payload.interventionId?.trim();
  const requestId = payload.requestId?.trim();
  const status = payload.status ?? "signed";
  if (!interventionId || !requestId) {
    return NextResponse.json({ error: "interventionId and requestId required" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection("interventions").doc(interventionId);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = snap.data() ?? {};
  const storedRequestId =
    typeof data.remoteSignRequestId === "string" ? data.remoteSignRequestId.trim() : "";
  const remoteSignStatus = typeof data.remoteSignStatus === "string" ? data.remoteSignStatus : null;

  if (!storedRequestId || storedRequestId !== requestId) {
    return NextResponse.json({ error: "Invalid requestId" }, { status: 400 });
  }
  if (remoteSignStatus !== "pending") {
    return NextResponse.json({ error: "Signature not pending" }, { status: 409 });
  }

  const at = new Date().toISOString();
  const companyId =
    typeof data.companyId === "string" && data.companyId.length > 0 ? data.companyId : null;

  await ref.update({
    remoteSignStatus: status,
    remoteSignatureUrl: payload.signatureUrl?.trim() || `mock-signature://${interventionId}`,
    updatedAt: at,
  });

  await ref.collection("timeline_events").add({
    interventionId,
    type: "comment",
    content:
      status === "signed"
        ? "Rapport signé électroniquement par le client"
        : "Signature électronique refusée",
    visibility: "client",
    createdAt: at,
    createdByUid: "esign-webhook",
    companyId,
  });

  if (companyId) {
    const title = typeof data.title === "string" ? data.title : "Dossier";
    void notifyCompanyAdminsPush({
      companyId,
      title: status === "signed" ? "Rapport signé" : "Signature refusée",
      body:
        status === "signed"
          ? `${title} — prêt à facturer`
          : `${title} — signature refusée par le client`,
      data: {
        type: status === "signed" ? "esign_signed" : "esign_declined",
        bmInterventionId: interventionId,
      },
    }).catch(() => {});
  }

  return NextResponse.json({ received: true });
}
