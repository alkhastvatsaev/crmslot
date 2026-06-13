import {
  applyQuickInvoiceAdjust,
  formatInvoiceTotalEur,
  invoiceTotalCents,
} from "../technicianInvoiceQuickAdjust";

const BASE = [
  { description: "Forfait ouverture", quantity: 1, unitPriceCents: 12500 },
  { description: "Déplacement urgent", quantity: 1, unitPriceCents: 4500 },
];

describe("technicianInvoiceQuickAdjust", () => {
  it("ajoute une ligne déplacement", () => {
    const next = applyQuickInvoiceAdjust(BASE, "add_travel");
    expect(next.some((l) => l.description.includes("Déplacement forfaitaire"))).toBe(true);
    expect(invoiceTotalCents(next)).toBeGreaterThan(invoiceTotalCents(BASE));
  });

  it("applique une remise 10 %", () => {
    const next = applyQuickInvoiceAdjust(BASE, "discount_10");
    expect(invoiceTotalCents(next)).toBe(Math.round(invoiceTotalCents(BASE) * 0.9));
  });

  it("formate le total en EUR", () => {
    expect(formatInvoiceTotalEur(17000)).toMatch(/170/);
  });
});
