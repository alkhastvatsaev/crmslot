import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";

export type SubscriptionPlanDefinition = {
  id: SubscriptionPlanId;
  nameKey: string;
  priceEurMonthly: number;
  foundingPriceEurMonthly: number;
  technicianSeatsIncluded: number;
  featureKeys: readonly string[];
  highlight?: boolean;
};

/** Grille publique — les montants Stripe doivent correspondre (Dashboard). */
export const SUBSCRIPTION_PLANS: readonly SubscriptionPlanDefinition[] = [
  {
    id: "solo",
    nameKey: "subscription.plans.solo.name",
    priceEurMonthly: 49,
    foundingPriceEurMonthly: 34,
    technicianSeatsIncluded: 1,
    featureKeys: [
      "subscription.plans.solo.features.crm",
      "subscription.plans.solo.features.map",
      "subscription.plans.solo.features.tech_app",
      "subscription.plans.solo.features.billing_basic",
    ],
  },
  {
    id: "team",
    nameKey: "subscription.plans.team.name",
    priceEurMonthly: 89,
    foundingPriceEurMonthly: 62,
    technicianSeatsIncluded: 5,
    highlight: true,
    featureKeys: [
      "subscription.plans.team.features.all_solo",
      "subscription.plans.team.features.portal",
      "subscription.plans.team.features.planning",
      "subscription.plans.team.features.offline",
    ],
  },
  {
    id: "pro",
    nameKey: "subscription.plans.pro.name",
    priceEurMonthly: 149,
    foundingPriceEurMonthly: 104,
    technicianSeatsIncluded: 15,
    featureKeys: [
      "subscription.plans.pro.features.all_team",
      "subscription.plans.pro.features.peppol",
      "subscription.plans.pro.features.gmail",
      "subscription.plans.pro.features.chatbot",
    ],
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
