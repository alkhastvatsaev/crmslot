import { resolveInvoiceBaseAmountCents } from "@/features/commissions/computeInterventionCommission";

describe("resolveInvoiceBaseAmountCents", () => {
  it("uses provided cents when positive", () => {
    expect(resolveInvoiceBaseAmountCents(25_000)).toBe(25_000);
  });

  it("defaults to 15000 when missing", () => {
    expect(resolveInvoiceBaseAmountCents(null)).toBe(15_000);
    expect(resolveInvoiceBaseAmountCents(undefined)).toBe(15_000);
  });
});
