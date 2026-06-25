import "@/core/config/firebase-admin";
import { NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { requireCronSecret } from "@/core/api/routeAuth";
import { runGoogleReviewRequestsAdmin } from "@/features/notifications/server/runGoogleReviewRequestsAdmin";

export const runtime = "nodejs";

/**
 * GET /api/cron/google-review-requests — demande d'avis Google (mail séparé, délai, 1×/dossier).
 * Auth : Bearer CRON_SECRET (Vercel Cron).
 */
export async function GET(request: Request) {
  const guard = requireCronSecret(request);
  if (guard) return guard;

  if (!isFirebaseAdminReady()) {
    return NextResponse.json(
      { ok: false, error: "Firebase Admin not configured" },
      { status: 503 }
    );
  }

  const report = await runGoogleReviewRequestsAdmin(getAdminDb());
  return NextResponse.json({ ok: true, ...report });
}
