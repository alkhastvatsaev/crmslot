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
  clampTechnicianQuantity,
  computeSubscriptionMonthlyTotal,
  MIN_TECHNICIAN_QUANTITY,
  MAX_TECHNICIAN_QUANTITY,
  SUBSCRIPTION_PLANS,
  ANNUAL_MONTHS_BILLED,
  PUBLIC_SUBSCRIPTION_PLAN_ID,
  getSubscriptionPlan,
  isSubscriptionPlanId,
  normalizeSubscriptionPlanId,
  technicianPlanDisplayPrice,
  technicianPlanAnnualTotal,
  type SubscriptionBillingInterval,
} from "@/features/subscriptions/subscriptionPlans";
export {
  clearAutoCheckoutAttempted,
  clearPendingSubscriptionPlan,
  clearSubscriptionCheckoutCompleted,
  markAutoCheckoutAttempted,
  markPendingSubscriptionCheckout,
  markSubscriptionCheckoutCompleted,
  readPendingSubscriptionPlan,
  readPlanIdFromSearchParams,
  savePendingSubscriptionPlan,
  wasAutoCheckoutAttempted,
  wasSubscriptionCheckoutCompleted,
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
export { default as PricingLanding } from "@/features/subscriptions/components/PricingLanding";
export { default as SubscriptionAccessGate } from "@/features/subscriptions/components/SubscriptionAccessGate";
export { default as SubscriptionPaywall } from "@/features/subscriptions/components/SubscriptionPaywall";
export { startSubscriptionCheckout } from "@/features/subscriptions/startSubscriptionCheckoutClient";
export { default as SubscriptionCheckoutReturnEffects } from "@/features/subscriptions/components/SubscriptionCheckoutReturnEffects";
export { default as SubscriptionSignupEffects } from "@/features/subscriptions/components/SubscriptionSignupEffects";
export { useCompanySubscription } from "@/features/subscriptions/hooks/useCompanySubscription";
export { usePendingSubscriptionPlan } from "@/features/subscriptions/hooks/usePendingSubscriptionPlan";
