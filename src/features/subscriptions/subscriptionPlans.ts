import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";

export type SubscriptionPlanDefinition = {
  id: SubscriptionPlanId;
  nameKey: string;
  taglineKey: string;
  priceEurMonthly: number;
  foundingPriceEurMonthly: number;
  technicianSeatsIncluded: number;
  highlight?: boolean;
};

/** Grille publique — les montants Stripe doivent correspondre (Dashboard). */
export const SUBSCRIPTION_PLANS: readonly SubscriptionPlanDefinition[] = [
  {
    id: "solo",
    nameKey: "subscription.plans.solo.name",
    taglineKey: "subscription.plans.solo.tagline",
    priceEurMonthly: 49,
    foundingPriceEurMonthly: 34,
    technicianSeatsIncluded: 1,
  },
  {
    id: "team",
    nameKey: "subscription.plans.team.name",
    taglineKey: "subscription.plans.team.tagline",
    priceEurMonthly: 89,
    foundingPriceEurMonthly: 62,
    technicianSeatsIncluded: 5,
    highlight: true,
  },
  {
    id: "pro",
    nameKey: "subscription.plans.pro.name",
    taglineKey: "subscription.plans.pro.tagline",
    priceEurMonthly: 149,
    foundingPriceEurMonthly: 104,
    technicianSeatsIncluded: 15,
  },
] as const;

export const EXTRA_TECHNICIAN_PRICE_EUR = 15;

const STRIPE_PRICE_ENV: Record<SubscriptionPlanId, string> = {
  solo: "STRIPE_SUBSCRIPTION_PRICE_SOLO",
  team: "STRIPE_SUBSCRIPTION_PRICE_TEAM",
  pro: "STRIPE_SUBSCRIPTION_PRICE_PRO",
};

export function getSubscriptionPlan(planId: SubscriptionPlanId): SubscriptionPlanDefinition {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error(`Plan inconnu: ${planId}`);
  return plan;
}

export function isSubscriptionPlanId(value: string): value is SubscriptionPlanId {
  return value === "solo" || value === "team" || value === "pro";
}

/** Price ID Stripe depuis l'environnement serveur. */
export function resolveStripePriceId(planId: SubscriptionPlanId): string | null {
  const key = STRIPE_PRICE_ENV[planId];
  return process.env[key]?.trim() || null;
}

export function subscriptionTrialDays(): number {
  const raw = process.env.SUBSCRIPTION_TRIAL_DAYS?.trim();
  if (!raw) return 14;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 14;
}
