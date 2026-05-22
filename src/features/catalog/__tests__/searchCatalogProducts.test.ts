import {
  mergeCatalogProducts,
  searchCatalogProducts,
  searchCatalogProductsScored,
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

  it("prefers poignée labels over serrure when query is poignée", () => {
    const catalog = [
      { sku: "S1", label: "Serrure 3 points", unitPriceCents: 200 },
      { sku: "P1", label: "Poignée Hoppe Tokyo sur rosace", unitPriceCents: 4500 },
    ];
    const hits = searchCatalogProductsScored(catalog, "poignée", 5);
    expect(hits[0]?.label.toLowerCase()).toContain("poign");
  });

  it("matches long natural-language queries by tokens", () => {
    const hits = searchCatalogProductsScored(
      catalog,
      "Cylindre double de chantier FTH fermeture differente",
      5,
    );
    expect(hits.some((p) => p.label.toLowerCase().includes("cylindre"))).toBe(true);
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
