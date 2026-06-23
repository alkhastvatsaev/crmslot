import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { notifyPortalAccessAdmin } from "@/features/interventions/server/portalAccessNotifyAdmin";
import type { Intervention } from "@/features/interventions";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedUser(_request);
  if ("response" in auth) return auth.response;

  const { id: interventionId } = await context.params;
  const db = getAdminDb();
  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  }

  const iv = { id: snap.id, ...snap.data() } as Intervention;
  if (iv.createdByUid !== auth.uid) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const result = await notifyPortalAccessAdmin({ db, interventionId, iv });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notification impossible";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
