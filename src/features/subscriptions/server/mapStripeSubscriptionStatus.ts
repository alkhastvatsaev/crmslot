import type Stripe from "stripe";
import type { SubscriptionStatus } from "@/features/subscriptions/subscriptionTypes";

/** Mappe le statut Stripe vers notre modèle Firestore. */
export function mapStripeSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (stripeStatus) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
      return "incomplete";
    case "unpaid":
      return "unpaid";
    case "incomplete_expired":
    case "paused":
      return "canceled";
    default:
      return "none";
  }
}
