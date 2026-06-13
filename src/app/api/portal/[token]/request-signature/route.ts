import { NextResponse } from "next/server";
import { getAdminDb } from "@/core/config/firebase-admin";
import { featureFlagsFromEnv } from "@/core/featureFlags";
import { getESignProvider } from "@/features/esign/ESignProvider";
import {
  findInterventionByPortalToken,
  isValidPortalAccessToken,
} from "@/features/interventions/server/portalLookupAdmin";

export const runtime = "nodejs";

type Body = {
  documentType?: "quote" | "report";
  signerName?: string;
  signerEmail?: string;
};

/** POST /api/portal/[token]/request-signature — signature e-sign anonyme via lien suivi. */
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!featureFlagsFromEnv().remoteESign) {
    return NextResponse.json({ ok: false, error: "Feature disabled" }, { status: 403 });
  }

  const { token } = await context.params;
  if (!isValidPortalAccessToken(token)) {
    return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 400 });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const db = getAdminDb();
  const iv = await findInterventionByPortalToken(db, token);
  if (!iv) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const provider = getESignProvider();
  const signerName =
    body.signerName?.trim() ||
    [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ") ||
    "Client";
  const signerEmail = body.signerEmail?.trim() || iv.clientEmail?.trim() || "";

  const result = await provider.createSignRequest({
    interventionId: iv.id,
    documentType: body.documentType ?? "report",
    signerName,
    signerEmail,
  });

  const at = new Date().toISOString();
  await db.collection("interventions").doc(iv.id).update({
    remoteSignStatus: result.status,
    remoteSignRequestId: result.requestId,
    remoteSignUrl: result.signUrl,
    remoteSignatureUrl: null,
    updatedAt: at,
  });

  await db
    .collection("interventions")
    .doc(iv.id)
    .collection("timeline_events")
    .add({
      interventionId: iv.id,
      type: "comment",
      content: "Demande de signature électronique envoyée au client",
      visibility: "client",
      createdAt: at,
      createdByUid: "portal",
      companyId: iv.companyId ?? null,
    });

  return NextResponse.json({ ok: true, signUrl: result.signUrl, requestId: result.requestId });
}
