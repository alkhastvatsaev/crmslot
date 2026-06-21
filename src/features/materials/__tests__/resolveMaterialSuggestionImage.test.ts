import { locksmithStockCatalogRows } from "@/features/catalog/locksmithStockSeedCatalog";
import { suggestMaterialPartsFromIntervention } from "@/features/materials/suggestMaterialPartsFromIntervention";

describe("resolveMaterialSuggestionImage", () => {
  it("suggestions ship with overlay image urls from catalog", () => {
    const stockItems = locksmithStockCatalogRows();
    const parts = suggestMaterialPartsFromIntervention(
      {
        problem: "Cylindre européen cassé, barillet bloqué",
        title: "Remplacement cylindre",
        category: "serrurerie",
      },
      stockItems
    );

    expect(parts.length).toBeGreaterThan(0);
    expect(parts.every((p) => Boolean(p.imageUrl?.trim()))).toBe(true);
    expect(parts.every((p) => Boolean(p.stockItemId))).toBe(true);
  });
});
