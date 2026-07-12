import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";

export type SubscriptionPlanDefinition = {
  id: SubscriptionPlanId;
  nameKey: string;
  taglineKey: string;
  /** Tarif unitaire HT — facturé par technicien actif (Stripe quantity). */
  technicianPriceEurMonthly: number;
  featureKeys: readonly string[];
  highlight?: boolean;
};

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
      "subscription.plans.solo.features.tech_app",
      "subscription.plans.solo.features.billing_basic",
    ],
  },
  {
    id: "team",
    nameKey: "subscription.plans.team.name",
    taglineKey: "subscription.plans.team.tagline",
    technicianPriceEurMonthly: 22,
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
    taglineKey: "subscription.plans.pro.tagline",
    technicianPriceEurMonthly: 27,
    featureKeys: [
      "subscription.plans.pro.features.all_team",
      "subscription.plans.pro.features.peppol",
      "subscription.plans.pro.features.gmail",
      "subscription.plans.pro.features.chatbot",
    ],
  },
] as const;

export const MIN_TECHNICIAN_QUANTITY = 1;
export const MAX_TECHNICIAN_QUANTITY = 99;

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
