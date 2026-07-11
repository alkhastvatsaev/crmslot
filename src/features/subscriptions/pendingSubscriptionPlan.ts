import { isSubscriptionPlanId } from "@/features/subscriptions/subscriptionPlans";
import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";

const STORAGE_KEY = "crmslot_pending_plan";

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
}

export function readPlanIdFromSearchParams(params: URLSearchParams): SubscriptionPlanId | null {
  const raw = params.get("plan")?.trim();
  return raw && isSubscriptionPlanId(raw) ? raw : null;
}
