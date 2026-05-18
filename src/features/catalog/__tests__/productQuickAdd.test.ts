import {
  filterCatalogForIntervention,
  STUB_CATALOG,
  catalogLineFromProduct,
} from "@/features/catalog/productQuickAdd";

describe("productQuickAdd", () => {
  it("prefilters by intervention category", () => {
    const rows = filterCatalogForIntervention(STUB_CATALOG, { category: "serrurerie" });
    expect(rows.every((r) => !r.category || r.category === "serrurerie")).toBe(true);
  });

  it("builds billing line from product", () => {
    expect(catalogLineFromProduct(STUB_CATALOG[0]!)).toMatchObject({
      reference: "CYL-A2P",
      quantity: 1,
    });
  });
});
