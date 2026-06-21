import { locksmithStockCatalogRows } from "@/features/catalog/locksmithStockSeedCatalog";
import {
  stockItemHasDisplayImage,
  suggestMaterialPartsFromIntervention,
} from "@/features/materials/suggestMaterialPartsFromIntervention";

const catalog = locksmithStockCatalogRows();

describe("suggestMaterialPartsFromIntervention", () => {
  it("returns up to 3 catalog items with images for a claquée door problem", () => {
    const parts = suggestMaterialPartsFromIntervention(
      {
        problem: "Porte claquée, clé restée à l'intérieur",
        title: "Ouverture porte",
        category: "serrurerie",
      },
      catalog
    );

    expect(parts.length).toBeGreaterThan(0);
    expect(parts.length).toBeLessThanOrEqual(3);
    expect(parts.every((p) => p.stockItemId && p.imageUrl)).toBe(true);
    expect(parts.every((p) => catalog.some((c) => c.id === p.stockItemId))).toBe(true);
  });

  it("suggests cylinder from catalog when barillet is mentioned", () => {
    const parts = suggestMaterialPartsFromIntervention(
      {
        problem: "Cylindre européen cassé, barillet bloqué",
        title: "Remplacement cylindre",
        category: "serrurerie",
      },
      catalog
    );

    expect(parts.some((p) => /cylindr|barillet/i.test(p.description))).toBe(true);
    expect(parts[0]?.imageUrl).toBeTruthy();
  });

  it("returns empty list when no client context", () => {
    expect(suggestMaterialPartsFromIntervention({ title: "" }, catalog)).toEqual([]);
  });

  it("deduplicates catalog references", () => {
    const parts = suggestMaterialPartsFromIntervention(
      {
        problem: "Serrure multipoint 3 points à remplacer, gâche usée",
        title: "Multipoint",
        category: "serrurerie",
      },
      catalog
    );

    const refs = parts.map((p) => p.reference?.toLowerCase());
    expect(new Set(refs).size).toBe(refs.length);
  });

  it("only suggests items with display images", () => {
    expect(catalog.filter(stockItemHasDisplayImage).length).toBeGreaterThanOrEqual(3);
  });
});
