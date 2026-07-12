import { isSubscriptionPlanId } from "@/features/subscriptions/subscriptionPlans";
import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";

const STORAGE_KEY = "crmslot_pending_plan";
const PRICING_REDIRECT_KEY = "crmslot_pricing_redirect_done";

export function savePendingSubscriptionPlan(planId: SubscriptionPlanId): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, planId);
}

export function readPendingSubscriptionPlan(): SubscriptionPlanId | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY)?.trim();
  return raw && isSubscriptionPlanId(raw) ? raw : null;
}

export function clearPendingSubscriptionPlan(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(PRICING_REDIRECT_KEY);
}

/** Une seule redirection auto vers /pricing par session (après auth). */
export function markSubscriptionPricingRedirectDone(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PRICING_REDIRECT_KEY, "1");
}

export function wasSubscriptionPricingRedirectDone(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PRICING_REDIRECT_KEY) === "1";
}

export function readPlanIdFromSearchParams(params: URLSearchParams): SubscriptionPlanId | null {
  const raw = params.get("plan")?.trim();
  return raw && isSubscriptionPlanId(raw) ? raw : null;
}
