import {
  isSubscriptionActive,
  parseCompanySaasSubscription,
  subscriptionEnforcementEnabled,
} from "@/features/subscriptions/subscriptionAccess";
import {
  SUBSCRIPTION_PLANS,
  getSubscriptionPlan,
  isSubscriptionPlanId,
  resolveStripePriceId,
  subscriptionTrialDays,
} from "@/features/subscriptions/subscriptionPlans";

describe("subscriptionPlans", () => {
  it("defines three public plans", () => {
    expect(SUBSCRIPTION_PLANS.map((p) => p.id)).toEqual(["solo", "team", "pro"]);
    expect(getSubscriptionPlan("team").technicianPriceEurMonthly).toBe(89);
  });

  it("validates plan ids", () => {
    expect(isSubscriptionPlanId("solo")).toBe(true);
    expect(isSubscriptionPlanId("enterprise")).toBe(false);
  });

  it("defaults trial to 14 days", () => {
    const prev = process.env.SUBSCRIPTION_TRIAL_DAYS;
    delete process.env.SUBSCRIPTION_TRIAL_DAYS;
    expect(subscriptionTrialDays()).toBe(14);
    process.env.SUBSCRIPTION_TRIAL_DAYS = prev;
  });

  it("reads stripe price id from env", () => {
    process.env.STRIPE_SUBSCRIPTION_PRICE_SOLO = "price_test_solo";
    expect(resolveStripePriceId("solo")).toBe("price_test_solo");
    delete process.env.STRIPE_SUBSCRIPTION_PRICE_SOLO;
  });
});

describe("subscriptionAccess", () => {
  it("parses firestore subscription doc", () => {
    const parsed = parseCompanySaasSubscription({
      planId: "pro",
      status: "active",
      stripeCustomerId: "cus_1",
    });
    expect(parsed?.planId).toBe("pro");
    expect(isSubscriptionActive(parsed)).toBe(true);
  });

  it("grandfathered bypasses status", () => {
    const parsed = parseCompanySaasSubscription({
      planId: "solo",
      status: "canceled",
      grandfathered: true,
    });
    expect(isSubscriptionActive(parsed)).toBe(true);
  });

  it("enforcement is opt-in", () => {
    delete process.env.NEXT_PUBLIC_SUBSCRIPTION_ENFORCE;
    expect(subscriptionEnforcementEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_SUBSCRIPTION_ENFORCE = "true";
    expect(subscriptionEnforcementEnabled()).toBe(true);
    delete process.env.NEXT_PUBLIC_SUBSCRIPTION_ENFORCE;
  });
});
