import "@/core/config/firebase-admin";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { getAdminDb, isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";
import { featureFlagsFromEnv } from "@/core/featureFlags";
import { getESignProvider } from "@/features/esign/ESignProvider";
import type { Intervention } from "@/features/interventions/types";

export const runtime = "nodejs";

type Body = {
  documentType?: "quote" | "report";
  signerName?: string;
  signerEmail?: string;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!featureFlagsFromEnv().remoteESign) {
    return NextResponse.json({ ok: false, error: "Feature disabled" }, { status: 403 });
  }

  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;
  if (!isFirebaseAdminReady()) {
    return NextResponse.json(
      { ok: false, error: "Firebase Admin not configured" },
      { status: 503 }
    );
  }

  const { id: interventionId } = await context.params;
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const db = getAdminDb();
  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const iv = { id: snap.id, ...snap.data() } as Intervention;
  const companyId = iv.companyId?.trim() ?? "";
  if (!companyId) {
    return NextResponse.json({ ok: false, error: "companyId manquant" }, { status: 400 });
  }

  const allowed = await assertCanAssignInterventionServer(
    db,
    auth.decoded.uid,
    companyId,
    auth.decoded
  );
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const provider = getESignProvider();
  const result = await provider.createSignRequest({
    interventionId,
    documentType: body.documentType ?? "report",
    signerName: body.signerName?.trim() || "Client",
    signerEmail: body.signerEmail?.trim() || "",
  });

  await db.collection("interventions").doc(interventionId).update({
    remoteSignStatus: result.status,
    remoteSignRequestId: result.requestId,
    remoteSignUrl: result.signUrl,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, signUrl: result.signUrl, requestId: result.requestId });
}
