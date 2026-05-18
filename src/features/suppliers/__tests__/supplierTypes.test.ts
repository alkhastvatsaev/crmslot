import { computeOrderTotal, type SupplierOrderLine } from "../types";

describe("computeOrderTotal", () => {
  it("returns 0 for empty lines", () => {
    expect(computeOrderTotal([])).toBe(0);
  });

  it("computes total correctly", () => {
    const lines: SupplierOrderLine[] = [
      { sku: "A", label: "Item A", quantity: 2, unitPriceCents: 5000 },
      { sku: "B", label: "Item B", quantity: 1, unitPriceCents: 8000 },
    ];
    expect(computeOrderTotal(lines)).toBe(18000);
  });

  it("rounds fractional cents", () => {
    const lines: SupplierOrderLine[] = [
      { sku: "C", label: "Item C", quantity: 3, unitPriceCents: 333 },
    ];
    expect(computeOrderTotal(lines)).toBe(999);
  });
});
