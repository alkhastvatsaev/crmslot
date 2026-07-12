import type { Firestore } from "firebase-admin/firestore";
import type Stripe from "stripe";
import {
  clampTechnicianQuantity,
  getSubscriptionPlan,
  isSubscriptionPlanId,
  resolveStripePriceId,
  subscriptionTrialDays,
} from "@/features/subscriptions/subscriptionPlans";
import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";
import { ensureStripeCustomerAdmin } from "@/features/subscriptions/server/ensureStripeCustomerAdmin";

function resolveAppOrigin(): string {
  return (
    process.env.PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

type CreateCheckoutInput = {
  db: Firestore;
  stripe: Stripe;
  companyId: string;
  planId: SubscriptionPlanId;
  technicianQuantity: number;
  adminUid: string;
  adminEmail: string | null;
};

export async function createSubscriptionCheckoutAdmin(
  input: CreateCheckoutInput
): Promise<{ url: string }> {
  if (!isSubscriptionPlanId(input.planId)) {
    throw new Error("Plan invalide.");
  }

  const priceId = resolveStripePriceId(input.planId);
  if (!priceId) {
    throw new Error(`Price Stripe manquant pour le plan ${input.planId}.`);
  }

  const companySnap = await input.db.doc(`companies/${input.companyId}`).get();
  if (!companySnap.exists) {
    throw new Error("Société introuvable.");
  }

  const companyName =
    typeof companySnap.data()?.name === "string" ? (companySnap.data()?.name as string) : "Société";

  getSubscriptionPlan(input.planId);
  const technicianQuantity = clampTechnicianQuantity(input.technicianQuantity);

  const customerId = await ensureStripeCustomerAdmin({
    db: input.db,
    stripe: input.stripe,
    companyId: input.companyId,
    companyName,
    adminEmail: input.adminEmail,
    adminUid: input.adminUid,
  });

  const origin = resolveAppOrigin();
  const trialDays = subscriptionTrialDays();

  const session = await input.stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: technicianQuantity }],
    success_url: `${origin}/?subscription=success&plan=${input.planId}`,
    cancel_url: `${origin}/pricing?canceled=1`,
    allow_promotion_codes: true,
    client_reference_id: input.companyId,
    metadata: {
      purpose: "saas_subscription",
      companyId: input.companyId,
      planId: input.planId,
      technicianQuantity: String(technicianQuantity),
      adminUid: input.adminUid,
    },
    subscription_data: {
      metadata: {
        companyId: input.companyId,
        planId: input.planId,
        technicianQuantity: String(technicianQuantity),
      },
      ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
    },
  });

  if (!session.url) {
    throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
  }

  return { url: session.url };
}
