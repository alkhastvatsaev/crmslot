import {
  buildInterventionMaterialOrderPrompt,
  parseInterventionMaterialOrderIntent,
} from "@/features/materials/interventionMaterialOrderPrompt";
import { matchStockCatalogItem } from "@/features/materials/matchStockCatalogItem";
import { locksmithStockCatalogRows } from "@/features/catalog/locksmithStockSeedCatalog";

describe("interventionMaterialOrderPrompt", () => {
  it("builds and parses round-trip prompt", () => {
    const prompt = buildInterventionMaterialOrderPrompt({
      quantity: 2,
      description: "Cylindre européen standard",
      reference: "CYL-EURO-80",
      interventionId: "iv-abc123",
      clientName: "Jean Dupont",
    });

    expect(prompt).toContain('Commander 2× "Cylindre européen standard"');
    expect(prompt).toContain("dossier iv-abc123");
    expect(prompt).toContain("client : Jean Dupont");

    const parsed = parseInterventionMaterialOrderIntent(prompt);
    expect(parsed).toEqual({
      quantity: 2,
      description: "Cylindre européen standard",
      reference: "CYL-EURO-80",
      interventionId: "iv-abc123",
      clientName: "Jean Dupont",
    });
  });
});

describe("matchStockCatalogItem", () => {
  it("matches cylinder suggestion to seed catalog with image", () => {
    const stockItems = locksmithStockCatalogRows();
    const matched = matchStockCatalogItem(
      { description: "Cylindre européen standard", quantity: 1, reference: "CYL-STD" },
      stockItems
    );

    expect(matched.stockItemId).toBeTruthy();
    expect(matched.catalogReference).toBeTruthy();
    expect(matched.imageUrl).toBeTruthy();
  });
});
