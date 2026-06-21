import { locksmithStockCatalogRows } from "@/features/catalog/locksmithStockSeedCatalog";
import { enrichMaterialPartSuggestions } from "@/features/materials/matchStockCatalogItem";
import {
  buildStockCatalogById,
  resolveMaterialSuggestionImageUrl,
  stockItemsForSuggestionImages,
} from "@/features/materials/resolveMaterialSuggestionImage";
import { suggestMaterialPartsFromIntervention } from "@/features/materials/suggestMaterialPartsFromIntervention";

describe("resolveMaterialSuggestionImage", () => {
  it("resolves image for cylinder suggestion via catalog overlay", () => {
    const stockItems = locksmithStockCatalogRows();
    const [part] = enrichMaterialPartSuggestions(
      suggestMaterialPartsFromIntervention({
        problem: "Cylindre européen cassé, barillet bloqué",
        title: "Remplacement cylindre",
        category: "serrurerie",
      }),
      stockItems
    );
    const catalogById = buildStockCatalogById(stockItems);
    const forImages = stockItemsForSuggestionImages([part], catalogById);
    expect(forImages.length).toBeGreaterThan(0);

    const url = resolveMaterialSuggestionImageUrl(part, catalogById, {});
    expect(url).toBeTruthy();
  });
});
