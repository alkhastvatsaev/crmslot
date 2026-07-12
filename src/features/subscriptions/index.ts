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
export {
  clearPendingSubscriptionPlan,
  readPendingSubscriptionPlan,
  readPlanIdFromSearchParams,
  savePendingSubscriptionPlan,
} from "@/features/subscriptions/pendingSubscriptionPlan";
export {
  isSaasSignupFlow,
  provisionSaasCompanyForAdmin,
} from "@/features/subscriptions/provisionSaasCompanyClient";
export type {
  CompanySaasSubscription,
  SubscriptionPlanId,
  SubscriptionStatus,
} from "@/features/subscriptions/subscriptionTypes";
export { default as AccountSubscriptionRow } from "@/features/subscriptions/components/AccountSubscriptionRow";
export { default as PricingFaq } from "@/features/subscriptions/components/PricingFaq";
export { default as PricingPageEffects } from "@/features/subscriptions/components/PricingPageEffects";
export { default as PricingPlansGrid } from "@/features/subscriptions/components/PricingPlansGrid";
export { startSubscriptionCheckout } from "@/features/subscriptions/startSubscriptionCheckoutClient";
export { default as SubscriptionCheckoutReturnEffects } from "@/features/subscriptions/components/SubscriptionCheckoutReturnEffects";
export { default as SubscriptionSignupEffects } from "@/features/subscriptions/components/SubscriptionSignupEffects";
export { useCompanySubscription } from "@/features/subscriptions/hooks/useCompanySubscription";
export { usePendingSubscriptionPlan } from "@/features/subscriptions/hooks/usePendingSubscriptionPlan";
