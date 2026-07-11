import type { Firestore } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { parseCompanySaasSubscription } from "@/features/subscriptions/subscriptionAccess";

type EnsureCustomerInput = {
  db: Firestore;
  stripe: Stripe;
  companyId: string;
  companyName: string;
  adminEmail: string | null;
  adminUid: string;
};

/** Crée ou réutilise le client Stripe lié à la société. */
export async function ensureStripeCustomerAdmin(input: EnsureCustomerInput): Promise<string> {
  const companyRef = input.db.doc(`companies/${input.companyId}`);
  const snap = await companyRef.get();
  const data = snap.data();
  const existing = parseCompanySaasSubscription(data?.saasSubscription);
  const existingCustomerId = existing?.stripeCustomerId?.trim();
  if (existingCustomerId) return existingCustomerId;

  const customer = await input.stripe.customers.create({
    email: input.adminEmail ?? undefined,
    name: input.companyName.trim() || undefined,
    metadata: {
      companyId: input.companyId,
      adminUid: input.adminUid,
    },
  });

  await companyRef.set(
    {
      saasSubscription: {
        planId: existing?.planId ?? "team",
        status: existing?.status ?? "none",
        stripeCustomerId: customer.id,
        stripeSubscriptionId: existing?.stripeSubscriptionId ?? null,
        currentPeriodEndMs: existing?.currentPeriodEndMs ?? null,
        cancelAtPeriodEnd: existing?.cancelAtPeriodEnd ?? false,
      },
    },
    { merge: true }
  );

  return customer.id;
}
