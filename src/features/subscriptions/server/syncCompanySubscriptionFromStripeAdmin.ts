import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { isSubscriptionPlanId } from "@/features/subscriptions/subscriptionPlans";
import { mapStripeSubscriptionStatus } from "@/features/subscriptions/server/mapStripeSubscriptionStatus";
import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";

function resolvePlanId(subscription: Stripe.Subscription): SubscriptionPlanId {
  const fromMeta = subscription.metadata?.planId?.trim();
  if (fromMeta && isSubscriptionPlanId(fromMeta)) return fromMeta;

  const priceMeta = subscription.items.data[0]?.price?.metadata?.planId?.trim();
  if (priceMeta && isSubscriptionPlanId(priceMeta)) return priceMeta;

  return "team";
}

function resolveCustomerId(customer: Stripe.Subscription["customer"]): string | null {
  if (typeof customer === "string") return customer;
  if (customer && typeof customer === "object" && "id" in customer) {
    return typeof customer.id === "string" ? customer.id : null;
  }
  return null;
}

/** Persiste l'état d'abonnement SaaS sur `companies/{companyId}.saasSubscription`. */
export async function syncCompanySubscriptionFromStripeAdmin(
  db: Firestore,
  subscription: Stripe.Subscription
): Promise<string | null> {
  const companyId = subscription.metadata?.companyId?.trim();
  if (!companyId) return null;

  const planId = resolvePlanId(subscription);
  const status = mapStripeSubscriptionStatus(subscription.status);
  const customerId = resolveCustomerId(subscription.customer);
  const periodEndRaw = (subscription as unknown as { current_period_end?: number })
    .current_period_end;

  await db.doc(`companies/${companyId}`).set(
    {
      saasSubscription: {
        planId,
        status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        currentPeriodEndMs: typeof periodEndRaw === "number" ? periodEndRaw * 1000 : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end === true,
        updatedAt: FieldValue.serverTimestamp(),
      },
    },
    { merge: true }
  );

  return companyId;
}
