import { NextResponse } from "next/server";
import Stripe from "stripe";
import * as admin from "firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { requireCompanyAdmin } from "@/features/company/server/requireCompanyAdmin";
import { createSubscriptionCheckoutAdmin } from "@/features/subscriptions/index.server";
import { isSubscriptionPlanId } from "@/features/subscriptions/subscriptionPlans";

export const runtime = "nodejs";

async function resolveCompanyIdForAdmin(
  uid: string,
  requestedCompanyId: string | undefined
): Promise<{ companyId: string } | { needsCompany: true } | { error: string; status: number }> {
  const db = getAdminDb();

  if (requestedCompanyId?.trim()) {
    const guard = await requireCompanyAdmin(db, uid, requestedCompanyId);
    if ("status" in guard) {
      return { error: guard.error, status: guard.status };
    }
    const companySnap = await db.doc(`companies/${guard.companyId}`).get();
    if (!companySnap.exists) {
      return { needsCompany: true };
    }
    return { companyId: guard.companyId };
  }

  const memberships = await db.collection(`users/${uid}/company_memberships`).get();
  const adminMembership = memberships.docs.find((d) => d.data()?.role === "admin");
  if (!adminMembership) {
    return { needsCompany: true };
  }

  const companyId = adminMembership.id;
  const companySnap = await db.doc(`companies/${companyId}`).get();
  if (!companySnap.exists) {
    return { needsCompany: true };
  }

  return { companyId };
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecret) {
    return NextResponse.json({ error: "Stripe non configuré." }, { status: 500 });
  }

  let body: { companyId?: string; planId?: string; technicianQuantity?: number };
  try {
    body = (await request.json()) as {
      companyId?: string;
      planId?: string;
      technicianQuantity?: number;
    };
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const planId = body.planId?.trim();
  if (!planId || !isSubscriptionPlanId(planId)) {
    return NextResponse.json({ error: "planId requis (solo | team | pro)." }, { status: 400 });
  }

  const resolved = await resolveCompanyIdForAdmin(auth.uid, body.companyId?.trim());
  if ("needsCompany" in resolved) {
    return NextResponse.json(
      { needsCompany: true, error: "Créez une société avant de souscrire." },
      { status: 409 }
    );
  }
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2026-04-22.dahlia" });
  const db = getAdminDb();

  try {
    const userRecord = await admin.auth().getUser(auth.uid);
    const result = await createSubscriptionCheckoutAdmin({
      db,
      stripe,
      companyId: resolved.companyId,
      planId,
      technicianQuantity: body.technicianQuantity ?? 1,
      adminUid: auth.uid,
      adminEmail: userRecord.email ?? null,
    });
    return NextResponse.json({ url: result.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
