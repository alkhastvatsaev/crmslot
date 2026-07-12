import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";

export type SubscriptionBillingInterval = "monthly" | "yearly";

export type SubscriptionPlanDefinition = {
  id: SubscriptionPlanId;
  nameKey: string;
  taglineKey: string;
  /** Tarif unitaire HT — facturé par technicien actif (Stripe quantity). */
  technicianPriceEurMonthly: number;
  featureKeys: readonly string[];
  highlight?: boolean;
};

/** Mois facturés sur 12 — 2 mois offerts en annuel. */
export const ANNUAL_MONTHS_BILLED = 10;

/** Grille publique — les montants Stripe doivent être des prix **unitaires** par technicien. */
export const SUBSCRIPTION_PLANS: readonly SubscriptionPlanDefinition[] = [
  {
    id: "solo",
    nameKey: "subscription.plans.solo.name",
    taglineKey: "subscription.plans.solo.tagline",
    technicianPriceEurMonthly: 19,
    featureKeys: [
      "subscription.plans.solo.features.crm",
      "subscription.plans.solo.features.map",
      "subscription.plans.solo.features.field",
    ],
  },
  {
    id: "team",
    nameKey: "subscription.plans.team.name",
    taglineKey: "subscription.plans.team.tagline",
    technicianPriceEurMonthly: 22,
    highlight: true,
    featureKeys: [
      "subscription.plans.team.features.portal",
      "subscription.plans.team.features.dispatch",
      "subscription.plans.team.features.offline",
    ],
  },
  {
    id: "pro",
    nameKey: "subscription.plans.pro.name",
    taglineKey: "subscription.plans.pro.tagline",
    technicianPriceEurMonthly: 27,
    featureKeys: [
      "subscription.plans.pro.features.peppol",
      "subscription.plans.pro.features.gmail",
      "subscription.plans.pro.features.ai",
    ],
  },
] as const;

export const MIN_TECHNICIAN_QUANTITY = 1;
export const MAX_TECHNICIAN_QUANTITY = 99;

const STRIPE_PRICE_ENV: Record<SubscriptionBillingInterval, Record<SubscriptionPlanId, string>> = {
  monthly: {
    solo: "STRIPE_SUBSCRIPTION_PRICE_SOLO",
    team: "STRIPE_SUBSCRIPTION_PRICE_TEAM",
    pro: "STRIPE_SUBSCRIPTION_PRICE_PRO",
  },
  yearly: {
    solo: "STRIPE_SUBSCRIPTION_PRICE_SOLO_YEARLY",
    team: "STRIPE_SUBSCRIPTION_PRICE_TEAM_YEARLY",
    pro: "STRIPE_SUBSCRIPTION_PRICE_PRO_YEARLY",
  },
};

export function technicianPlanDisplayPrice(
  plan: SubscriptionPlanDefinition,
  interval: SubscriptionBillingInterval
): number {
  if (interval === "monthly") return plan.technicianPriceEurMonthly;
  return Math.round((plan.technicianPriceEurMonthly * ANNUAL_MONTHS_BILLED) / 12);
}

export function technicianPlanAnnualTotal(plan: SubscriptionPlanDefinition): number {
  return plan.technicianPriceEurMonthly * ANNUAL_MONTHS_BILLED;
}

export function getSubscriptionPlan(planId: SubscriptionPlanId): SubscriptionPlanDefinition {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error(`Plan inconnu: ${planId}`);
  return plan;
}

export function isSubscriptionPlanId(value: string): value is SubscriptionPlanId {
  return value === "solo" || value === "team" || value === "pro";
}

export function clampTechnicianQuantity(raw: number): number {
  if (!Number.isFinite(raw)) return MIN_TECHNICIAN_QUANTITY;
  return Math.min(MAX_TECHNICIAN_QUANTITY, Math.max(MIN_TECHNICIAN_QUANTITY, Math.floor(raw)));
}

export function computeSubscriptionMonthlyTotal(
  planId: SubscriptionPlanId,
  technicianQuantity: number
): number {
  const plan = getSubscriptionPlan(planId);
  return plan.technicianPriceEurMonthly * clampTechnicianQuantity(technicianQuantity);
}

/** Price ID Stripe (unitaire / technicien) depuis l'environnement serveur. */
export function resolveStripePriceId(
  planId: SubscriptionPlanId,
  interval: SubscriptionBillingInterval = "monthly"
): string | null {
  const key = STRIPE_PRICE_ENV[interval][planId];
  const value = process.env[key]?.trim();
  if (value) return value;
  if (interval === "yearly") {
    return process.env[STRIPE_PRICE_ENV.monthly[planId]]?.trim() || null;
  }
  return null;
}

export function subscriptionTrialDays(): number {
  const raw = process.env.SUBSCRIPTION_TRIAL_DAYS?.trim();
  if (!raw) return 14;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 14;
}
