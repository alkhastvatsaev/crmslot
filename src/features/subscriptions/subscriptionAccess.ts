import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  type CompanySaasSubscription,
  type SubscriptionStatus,
} from "@/features/subscriptions/subscriptionTypes";

export function parseCompanySaasSubscription(raw: unknown): CompanySaasSubscription | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const planId = record.planId;
  const status = record.status;
  if (planId !== "solo" && planId !== "team" && planId !== "pro") return null;
  if (typeof status !== "string") return null;
  const allowed: SubscriptionStatus[] = [
    "trialing",
    "active",
    "past_due",
    "canceled",
    "incomplete",
    "unpaid",
    "none",
  ];
  if (!allowed.includes(status as SubscriptionStatus)) return null;

  return {
    planId,
    status: status as SubscriptionStatus,
    stripeCustomerId: typeof record.stripeCustomerId === "string" ? record.stripeCustomerId : null,
    stripeSubscriptionId:
      typeof record.stripeSubscriptionId === "string" ? record.stripeSubscriptionId : null,
    currentPeriodEndMs:
      typeof record.currentPeriodEndMs === "number" ? record.currentPeriodEndMs : null,
    cancelAtPeriodEnd: record.cancelAtPeriodEnd === true,
    grandfathered: record.grandfathered === true,
  };
}

export function isSubscriptionActive(sub: CompanySaasSubscription | null | undefined): boolean {
  if (!sub) return false;
  if (sub.grandfathered) return true;
  return ACTIVE_SUBSCRIPTION_STATUSES.has(sub.status);
}

export function subscriptionEnforcementEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SUBSCRIPTION_ENFORCE?.trim() === "true";
}

export function subscriptionCheckoutEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_SUBSCRIPTION_CHECKOUT_DISABLED?.trim() === "true") return false;
  return true;
}
