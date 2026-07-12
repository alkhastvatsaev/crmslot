import type { Firestore } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { syncCompanySubscriptionFromStripeAdmin } from "@/features/subscriptions/server/syncCompanySubscriptionFromStripeAdmin";

/** Active l'abonnement immédiatement après retour Stripe (sans attendre le webhook). */
export async function syncSubscriptionCheckoutSessionAdmin(input: {
  db: Firestore;
  stripe: Stripe;
  adminUid: string;
  sessionId: string;
}): Promise<boolean> {
  const session = await input.stripe.checkout.sessions.retrieve(input.sessionId);
  if (session.metadata?.purpose !== "saas_subscription") return false;
  if (session.metadata?.adminUid?.trim() !== input.adminUid) return false;

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subscriptionId) return false;

  const subscription = await input.stripe.subscriptions.retrieve(subscriptionId);
  await syncCompanySubscriptionFromStripeAdmin(input.db, subscription);
  return true;
}
