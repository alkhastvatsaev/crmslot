import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { requireCompanyAdmin } from "@/features/company/server/requireCompanyAdmin";
import { createBillingPortalSessionAdmin } from "@/features/subscriptions/index.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecret) {
    return NextResponse.json({ error: "Stripe non configuré." }, { status: 500 });
  }

  let body: { companyId?: string };
  try {
    body = (await request.json()) as { companyId?: string };
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const companyId = body.companyId?.trim();
  if (!companyId) {
    return NextResponse.json({ error: "companyId requis." }, { status: 400 });
  }

  const db = getAdminDb();
  const guard = await requireCompanyAdmin(db, auth.uid, companyId);
  if ("status" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2026-04-22.dahlia" });

  try {
    const result = await createBillingPortalSessionAdmin({
      db,
      stripe,
      companyId: guard.companyId,
    });
    return NextResponse.json({ url: result.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Portail impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
