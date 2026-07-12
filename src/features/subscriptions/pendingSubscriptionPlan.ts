import {
  isSubscriptionPlanId,
  normalizeSubscriptionPlanId,
  PUBLIC_SUBSCRIPTION_PLAN_ID,
} from "@/features/subscriptions/subscriptionPlans";
import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";

const STORAGE_KEY = "crmslot_pending_plan";
const CHECKOUT_COMPLETE_KEY = "crmslot_checkout_complete";
const AUTO_CHECKOUT_KEY = "crmslot_auto_checkout_attempted";

/** Marque qu’un checkout Stripe doit démarrer après auth (inscription SaaS). */
export function markPendingSubscriptionCheckout(): void {
  savePendingSubscriptionPlan(PUBLIC_SUBSCRIPTION_PLAN_ID);
}

export function savePendingSubscriptionPlan(planId: SubscriptionPlanId): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, normalizeSubscriptionPlanId(planId));
}

export function readPendingSubscriptionPlan(): SubscriptionPlanId | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY)?.trim();
  return raw && isSubscriptionPlanId(raw) ? normalizeSubscriptionPlanId(raw) : null;
}

export function clearPendingSubscriptionPlan(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(AUTO_CHECKOUT_KEY);
}

/** Après paiement Stripe validé — ne plus bloquer ni relancer checkout. */
export function markSubscriptionCheckoutCompleted(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CHECKOUT_COMPLETE_KEY, "1");
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(AUTO_CHECKOUT_KEY);
}

export function wasSubscriptionCheckoutCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(CHECKOUT_COMPLETE_KEY) === "1";
}

export function clearSubscriptionCheckoutCompleted(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CHECKOUT_COMPLETE_KEY);
}

export function markAutoCheckoutAttempted(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTO_CHECKOUT_KEY, "1");
}

export function wasAutoCheckoutAttempted(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTO_CHECKOUT_KEY) === "1";
}

export function clearAutoCheckoutAttempted(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTO_CHECKOUT_KEY);
}

export function readPlanIdFromSearchParams(params: URLSearchParams): SubscriptionPlanId | null {
  const raw = params.get("plan")?.trim();
  return raw && isSubscriptionPlanId(raw) ? normalizeSubscriptionPlanId(raw) : null;
}

export { PUBLIC_SUBSCRIPTION_PLAN_ID };
