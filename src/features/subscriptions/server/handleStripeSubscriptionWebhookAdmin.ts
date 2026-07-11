import type { Firestore } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { syncCompanySubscriptionFromStripeAdmin } from "@/features/subscriptions/server/syncCompanySubscriptionFromStripeAdmin";

/** Traite les événements Stripe liés à l'abonnement SaaS (≠ paiement intervention). */
export async function handleStripeSubscriptionWebhookAdmin(
  db: Firestore,
  stripe: Stripe,
  event: Stripe.Event
): Promise<void> {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.purpose !== "saas_subscription") return;

    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await syncCompanySubscriptionFromStripeAdmin(db, subscription);
    return;
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    if (!subscription.metadata?.companyId?.trim()) return;
    await syncCompanySubscriptionFromStripeAdmin(db, subscription);
  }
}
