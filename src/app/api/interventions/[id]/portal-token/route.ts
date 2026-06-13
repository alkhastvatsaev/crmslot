import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { getAdminDb, isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";
import { generatePortalAccessToken } from "@/features/interventions/portalToken";
import type { Intervention } from "@/features/interventions/types";

export const runtime = "nodejs";

/** POST — assure un `portalAccessToken` sur l'intervention (staff autorisé). */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;
  if (!isFirebaseAdminReady()) {
    return NextResponse.json(
      { ok: false, error: "Firebase Admin not configured" },
      { status: 503 }
    );
  }

  const { id: interventionId } = await context.params;
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

  const existing = iv.portalAccessToken?.trim();
  const portalAccessToken = existing || generatePortalAccessToken();
  if (!existing) {
    await db.collection("interventions").doc(interventionId).update({
      portalAccessToken,
      updatedAt: new Date().toISOString(),
    });
  }

  const base =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return NextResponse.json({
    ok: true,
    portalAccessToken,
    portalUrl: `${base}/suivi/${portalAccessToken}`,
  });
}
