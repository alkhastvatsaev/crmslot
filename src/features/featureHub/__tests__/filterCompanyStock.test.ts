import {
  applyStockListFilters,
  buildOpenOrderReferenceSet,
  filterStockByChip,
  filterStockItemsBySearch,
  isLowStockItem,
} from "@/features/featureHub/filterCompanyStock";
import type { StockItem } from "@/features/materials/stockFirestore";

const base: StockItem = {
  id: "s1",
  companyId: "co",
  reference: "LEC-001",
  description: "Cylindre sécurité",
  quantity: 2,
  alertThreshold: 5,
  unit: "pcs",
  updatedAt: "2026-01-01",
};

describe("filterCompanyStock", () => {
  it("detects low stock", () => {
    expect(isLowStockItem(base)).toBe(true);
    expect(isLowStockItem({ ...base, quantity: 10 })).toBe(false);
  });

  it("filters by search tokens", () => {
    const rows = filterStockItemsBySearch([base], "cylindre lec");
    expect(rows).toHaveLength(1);
    expect(filterStockItemsBySearch([base], "inexistant")).toHaveLength(0);
  });

  it("filters lecot chip", () => {
    expect(filterStockByChip([base], "lecot", new Set())).toHaveLength(1);
    expect(filterStockByChip([{ ...base, reference: "X" }], "lecot", new Set())).toHaveLength(0);
  });

  it("filters out-of-stock chip", () => {
    expect(filterStockByChip([base, { ...base, quantity: 0 }], "out", new Set())).toHaveLength(1);
  });

  it("applyStockListFilters sorts ruptures first", () => {
    const rows = applyStockListFilters(
      [base, { ...base, id: "s2", quantity: 0, description: "Rupture" }],
      { filter: "all", category: "all", search: "", openOrderRefs: new Set() },
    );
    expect(rows[0].quantity).toBe(0);
  });

  it("builds open order refs", () => {
    const refs = buildOpenOrderReferenceSet([
      {
        id: "mo1",
        interventionId: "iv1",
        technicianUid: "t1",
        partsRequested: [{ description: "Vis", quantity: 1, reference: "VIS-9" }],
        urgency: "normal",
        status: "pending",
        createdAt: "",
        updatedAt: "",
        companyId: "co",
      },
    ]);
    expect(refs.has("vis-9")).toBe(true);
    expect(refs.has("mo1")).toBe(true);
  });
});
