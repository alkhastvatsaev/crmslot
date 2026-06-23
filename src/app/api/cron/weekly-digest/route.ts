import "@/core/config/firebase-admin";
import { NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { requireCronSecret } from "@/core/api/routeAuth";
import { computeBillingHubMetrics } from "@/features/billingHub";
import type { Intervention } from "@/features/interventions";

export const runtime = "nodejs";

/**
 * GET /api/cron/weekly-digest — résumé hebdo facturation par société (email admin).
 * Auth : Bearer CRON_SECRET.
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

  const db = getAdminDb();
  const companiesSnap = await db.collection("companies").limit(50).get();
  let digests = 0;

  for (const companyDoc of companiesSnap.docs) {
    const companyId = companyDoc.id;
    const ivSnap = await db
      .collection("interventions")
      .where("companyId", "==", companyId)
      .where("status", "==", "invoiced")
      .limit(200)
      .get();
    const interventions = ivSnap.docs.map((d) => ({ ...(d.data() as Intervention), id: d.id }));
    const metrics = computeBillingHubMetrics(interventions);
    const adminEmail = String(companyDoc.data()?.adminEmail ?? "").trim();
    if (!adminEmail) continue;

    try {
      const base =
        process.env.NEXT_PUBLIC_BASE_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      const res = await fetch(`${base}/api/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "email",
          recipientRole: "dispatcher",
          subjectKey: "weekly_digest",
          bodyKey: "weekly_digest_body",
          variables: {
            companyId,
            recipientEmail: adminEmail,
            paidCount: String(metrics.paid),
            unpaidCount: String(metrics.unpaid),
            revenueEur: (metrics.totalHtCents / 100).toFixed(2),
          },
        }),
      });
      if (res.ok) digests += 1;
    } catch {
      // Continue sur les autres sociétés.
    }
  }

  return NextResponse.json({ ok: true, digests });
}
