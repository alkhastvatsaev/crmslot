/**
 * Abonnements SaaS CRMSLOT — plans, accès, UI tarifs.
 */
export {
  isSubscriptionActive,
  parseCompanySaasSubscription,
  subscriptionCheckoutEnabled,
  subscriptionEnforcementEnabled,
} from "@/features/subscriptions/subscriptionAccess";
export {
  EXTRA_TECHNICIAN_PRICE_EUR,
  SUBSCRIPTION_PLANS,
  getSubscriptionPlan,
  isSubscriptionPlanId,
} from "@/features/subscriptions/subscriptionPlans";
export type {
  CompanySaasSubscription,
  SubscriptionPlanId,
  SubscriptionStatus,
} from "@/features/subscriptions/subscriptionTypes";
export { default as PricingPlansGrid } from "@/features/subscriptions/components/PricingPlansGrid";
export { default as SubscriptionCheckoutReturnEffects } from "@/features/subscriptions/components/SubscriptionCheckoutReturnEffects";
export { useCompanySubscription } from "@/features/subscriptions/hooks/useCompanySubscription";
