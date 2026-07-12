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

/** Plan unique affiché sur /pricing (les ids legacy solo/pro redirigent ici). */
export const PUBLIC_SUBSCRIPTION_PLAN_ID = "team" as const;

/** Grille publique — un seul tarif unitaire / technicien. */
export const SUBSCRIPTION_PLANS: readonly SubscriptionPlanDefinition[] = [
  {
    id: PUBLIC_SUBSCRIPTION_PLAN_ID,
    nameKey: "subscription.plans.standard.name",
    taglineKey: "subscription.plans.standard.tagline",
    technicianPriceEurMonthly: 50,
    featureKeys: [
      "subscription.plans.standard.features.crm",
      "subscription.plans.standard.features.map",
      "subscription.plans.standard.features.portal",
      "subscription.plans.standard.features.peppol",
      "subscription.plans.standard.features.ai",
    ],
  },
] as const;

export const MIN_TECHNICIAN_QUANTITY = 1;
export const MAX_TECHNICIAN_QUANTITY = 99;

const STRIPE_PRICE_ENV: Record<SubscriptionBillingInterval, string> = {
  monthly: "STRIPE_SUBSCRIPTION_PRICE",
  yearly: "STRIPE_SUBSCRIPTION_PRICE_YEARLY",
};

/** Anciennes variables Vercel — rétrocompat après archivage des 3 produits Stripe. */
const STRIPE_PRICE_LEGACY_FALLBACK: Record<SubscriptionBillingInterval, string[]> = {
  monthly: ["STRIPE_SUBSCRIPTION_PRICE_TEAM"],
  yearly: ["STRIPE_SUBSCRIPTION_PRICE_TEAM_YEARLY"],
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

/** Normalise solo/pro/team vers le plan public unique. */
export function normalizeSubscriptionPlanId(planId: string | null | undefined): SubscriptionPlanId {
  if (planId && isSubscriptionPlanId(planId)) return PUBLIC_SUBSCRIPTION_PLAN_ID;
  return PUBLIC_SUBSCRIPTION_PLAN_ID;
}

export function getSubscriptionPlan(planId: SubscriptionPlanId): SubscriptionPlanDefinition {
  if (!isSubscriptionPlanId(planId)) {
    throw new Error(`Plan inconnu: ${planId}`);
  }
  return SUBSCRIPTION_PLANS[0];
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

/** Price ID Stripe (unitaire / technicien, 50 € HT / mois). */
export function resolveStripePriceId(
  planId: SubscriptionPlanId,
  interval: SubscriptionBillingInterval = "monthly"
): string | null {
  void planId;
  const primary = process.env[STRIPE_PRICE_ENV[interval]]?.trim();
  if (primary) return primary;

  for (const legacyKey of STRIPE_PRICE_LEGACY_FALLBACK[interval]) {
    const legacy = process.env[legacyKey]?.trim();
    if (legacy) return legacy;
  }

  if (interval === "yearly") {
    return resolveStripePriceId(planId, "monthly");
  }
  return null;
}

export function subscriptionTrialDays(): number {
  const raw = process.env.SUBSCRIPTION_TRIAL_DAYS?.trim();
  if (!raw) return 14;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 14;
}
