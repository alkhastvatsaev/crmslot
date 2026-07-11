/** Plan SaaS CRMSLOT — facturation plateforme (≠ facturation interventions). */
export type SubscriptionPlanId = "solo" | "team" | "pro";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid"
  | "none";

export type CompanySaasSubscription = {
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEndMs?: number | null;
  cancelAtPeriodEnd?: boolean;
  /** Sociétés existantes avant lancement abonnements — accès sans Stripe. */
  grandfathered?: boolean;
};

export const ACTIVE_SUBSCRIPTION_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  "trialing",
  "active",
]);
