import { mapStripeSubscriptionStatus } from "@/features/subscriptions/server/mapStripeSubscriptionStatus";

describe("mapStripeSubscriptionStatus", () => {
  it("maps active stripe statuses", () => {
    expect(mapStripeSubscriptionStatus("trialing")).toBe("trialing");
    expect(mapStripeSubscriptionStatus("active")).toBe("active");
    expect(mapStripeSubscriptionStatus("past_due")).toBe("past_due");
    expect(mapStripeSubscriptionStatus("canceled")).toBe("canceled");
  });
});
