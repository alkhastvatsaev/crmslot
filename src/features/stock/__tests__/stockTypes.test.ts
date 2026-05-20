import { isStockLow } from "../types";
import type { StockItem } from "../types";

const base: StockItem = {
  id: "s-1",
  companyId: "co-1",
  technicianUid: "tech-1",
  sku: "CYL-A2P",
  label: "Cylindre A2P",
  quantity: 5,
  minQuantity: 2,
  unitPriceCents: 3500,
  updatedAt: "2026-05-18T00:00:00.000Z",
};

describe("isStockLow", () => {
  it("returns false when quantity > minQuantity", () => {
    expect(isStockLow(base)).toBe(false);
  });

  it("returns true when quantity equals minQuantity", () => {
    expect(isStockLow({ ...base, quantity: 2 })).toBe(true);
  });

  it("returns true when quantity < minQuantity", () => {
    expect(isStockLow({ ...base, quantity: 0 })).toBe(true);
  });

  it("returns false when minQuantity is 0 and quantity is 0", () => {
    expect(isStockLow({ ...base, quantity: 0, minQuantity: 0 })).toBe(true);
  });
});
