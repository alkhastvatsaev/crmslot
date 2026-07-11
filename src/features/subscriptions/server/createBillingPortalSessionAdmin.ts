import type { Firestore } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { parseCompanySaasSubscription } from "@/features/subscriptions/subscriptionAccess";

function resolveAppOrigin(): string {
  return (
    process.env.PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

type CreatePortalInput = {
  db: Firestore;
  stripe: Stripe;
  companyId: string;
};

export async function createBillingPortalSessionAdmin(
  input: CreatePortalInput
): Promise<{ url: string }> {
  const snap = await input.db.doc(`companies/${input.companyId}`).get();
  if (!snap.exists) {
    throw new Error("Société introuvable.");
  }

  const sub = parseCompanySaasSubscription(snap.data()?.saasSubscription);
  const customerId = sub?.stripeCustomerId?.trim();
  if (!customerId) {
    throw new Error("Aucun client Stripe associé à cette société.");
  }

  const origin = resolveAppOrigin();
  const session = await input.stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/?subscription=portal_return`,
  });

  return { url: session.url };
}
