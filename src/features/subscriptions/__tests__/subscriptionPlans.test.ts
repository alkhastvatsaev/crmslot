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
  computeSubscriptionMonthlyTotal,
  subscriptionTrialDays,
  PUBLIC_SUBSCRIPTION_PLAN_ID,
} from "@/features/subscriptions/subscriptionPlans";

describe("subscriptionPlans", () => {
  it("defines a single public plan at 50 €/technicien", () => {
    expect(SUBSCRIPTION_PLANS.map((p) => p.id)).toEqual([PUBLIC_SUBSCRIPTION_PLAN_ID]);
    expect(getSubscriptionPlan("team").technicianPriceEurMonthly).toBe(50);
    expect(getSubscriptionPlan("solo").technicianPriceEurMonthly).toBe(50);
  });

  it("computes monthly total from technician quantity", () => {
    expect(computeSubscriptionMonthlyTotal("team", 4)).toBe(200);
  });

  it("validates legacy plan ids", () => {
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
    process.env.STRIPE_SUBSCRIPTION_PRICE_TEAM = "price_test_team";
    expect(resolveStripePriceId("solo")).toBe("price_test_team");
    delete process.env.STRIPE_SUBSCRIPTION_PRICE_TEAM;
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
