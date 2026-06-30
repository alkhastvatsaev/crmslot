import "@/core/config/firebase-admin";
import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { requireCronSecret } from "@/core/api/routeAuth";
import { getAdminDb, isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { runSupplierOrderProgressTickAdmin } from "@/features/notifications/server/runSupplierOrderProgressTickAdmin";

export const runtime = "nodejs";

/** Avance les commandes fournisseur (démo / délai 2j) et notifie chaque étape. */
export async function GET(request: Request) {
  const guard = requireCronSecret(request);
  if (guard) return guard;

  if (!isFirebaseAdminReady()) {
    return NextResponse.json(
      { ok: false, error: "Firebase Admin not configured" },
      { status: 503 }
    );
  }

  const report = await runSupplierOrderProgressTickAdmin(getAdminDb(), admin.auth);
  return NextResponse.json({ ok: true, ...report });
}
