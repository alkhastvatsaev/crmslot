import {
  formatBillingDocRef,
  formatBillingMoney,
} from "@/features/billing/billingPdfTheme";

describe("billingPdfTheme", () => {
  it("formatBillingMoney", () => {
    expect(formatBillingMoney(35000)).toMatch(/350,00\s*€/);
  });

  it("formatBillingDocRef shortens id", () => {
    expect(formatBillingDocRef("abc-iv-fac-demo-12")).toHaveLength(8);
  });
});
