import {
  mergeCatalogProducts,
  searchCatalogProducts,
} from "@/features/catalog/searchCatalogProducts";

describe("searchCatalogProducts", () => {
  const catalog = [
    { sku: "A", label: "Cylindre A2P", unitPriceCents: 100 },
    { sku: "B", label: "Serrure 3 points", unitPriceCents: 200 },
  ];

  it("returns prefix of catalog when query is empty", () => {
    expect(searchCatalogProducts(catalog, "", 1)).toHaveLength(1);
  });

  it("filters by sku or label", () => {
    expect(searchCatalogProducts(catalog, "cyl", 12)).toEqual([
      { sku: "A", label: "Cylindre A2P", unitPriceCents: 100 },
    ]);
  });

  it("deduplicates merged catalogs by sku", () => {
    const merged = mergeCatalogProducts(
      [{ sku: "X", label: "One", unitPriceCents: 1 }],
      [{ sku: "X", label: "Two", unitPriceCents: 2 }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.label).toBe("One");
  });
});
