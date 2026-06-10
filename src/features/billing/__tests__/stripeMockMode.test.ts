import { stripeMockPaymentsEnabled } from "../stripeMockMode";

describe("stripeMockPaymentsEnabled", () => {
  it("désactivé dès qu'une clé Stripe existe", () => {
    expect(
      stripeMockPaymentsEnabled({ STRIPE_SECRET_KEY: "sk_test_x", NODE_ENV: "development" })
    ).toBe(false);
    expect(
      stripeMockPaymentsEnabled({ STRIPE_SECRET_KEY: "sk_live_x", STRIPE_MOCK_MODE: "1" })
    ).toBe(false);
  });

  it("actif hors production sans clé", () => {
    expect(stripeMockPaymentsEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(stripeMockPaymentsEnabled({ NODE_ENV: "test" })).toBe(true);
  });

  it("inactif en production sans opt-in explicite", () => {
    expect(stripeMockPaymentsEnabled({ NODE_ENV: "production" })).toBe(false);
  });

  it("opt-in explicite STRIPE_MOCK_MODE=1 même en production", () => {
    expect(stripeMockPaymentsEnabled({ NODE_ENV: "production", STRIPE_MOCK_MODE: "1" })).toBe(true);
  });
});
