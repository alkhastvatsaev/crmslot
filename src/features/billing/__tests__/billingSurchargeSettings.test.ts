import {
  applyBillingSurchargeToLines,
  DEFAULT_BILLING_SURCHARGE_SETTINGS,
  normalizeBillingSurchargeSettings,
  resolveBillingSurchargeRatePercent,
} from "@/features/billing/billingSurchargeSettings";

describe("billingSurchargeSettings", () => {
  it("applies weekend rate on Saturday", () => {
    const rate = resolveBillingSurchargeRatePercent(
      "2026-06-27",
      "14:00",
      DEFAULT_BILLING_SURCHARGE_SETTINGS
    );
    expect(rate).toBe(50);
  });

  it("applies after-hour rate from 19:00", () => {
    const rate = resolveBillingSurchargeRatePercent(
      "2026-06-25",
      "19:30",
      DEFAULT_BILLING_SURCHARGE_SETTINGS
    );
    expect(rate).toBe(50);
  });

  it("does not apply during weekday business hours", () => {
    const rate = resolveBillingSurchargeRatePercent(
      "2026-06-25",
      "14:00",
      DEFAULT_BILLING_SURCHARGE_SETTINGS
    );
    expect(rate).toBe(0);
  });

  it("adds a majoration line on subtotal", () => {
    const lines = applyBillingSurchargeToLines(
      [{ description: "Main d'œuvre", quantity: 1, unitPriceCents: 10000 }],
      "2026-06-27",
      "14:00",
      DEFAULT_BILLING_SURCHARGE_SETTINGS
    );
    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatchObject({
      reference: "majoration",
      unitPriceCents: 5000,
      description: DEFAULT_BILLING_SURCHARGE_SETTINGS.lineLabel,
    });
  });

  it("normalizes firestore payload", () => {
    const normalized = normalizeBillingSurchargeSettings({
      enabled: true,
      weekendRatePercent: 40,
      afterHour: 20,
      afterHourRatePercent: 60,
    });
    expect(normalized.weekendRatePercent).toBe(40);
    expect(normalized.afterHour).toBe(20);
    expect(normalized.afterHourRatePercent).toBe(60);
  });
});
