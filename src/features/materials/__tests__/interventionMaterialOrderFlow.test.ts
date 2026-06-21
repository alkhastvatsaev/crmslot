import {
  buildInterventionMaterialOrderPrompt,
  parseInterventionMaterialOrderIntent,
} from "@/features/materials/interventionMaterialOrderPrompt";
import { locksmithStockCatalogRows } from "@/features/catalog/locksmithStockSeedCatalog";
import { suggestMaterialPartsFromIntervention } from "@/features/materials/suggestMaterialPartsFromIntervention";

describe("interventionMaterialOrderPrompt", () => {
  it("builds and parses round-trip prompt", () => {
    const prompt = buildInterventionMaterialOrderPrompt({
      quantity: 2,
      description: "Cylindre européen 80 mm sécurité",
      reference: "CYL-EURO-80",
      interventionId: "iv-abc123",
      clientName: "Jean Dupont",
    });

    expect(prompt).toContain('Commander 2× "Cylindre européen 80 mm sécurité"');
    expect(parseInterventionMaterialOrderIntent(prompt)?.interventionId).toBe("iv-abc123");
  });
});

describe("catalog suggestions for order flow", () => {
  it("returns catalog parts with image and reference", () => {
    const [part] = suggestMaterialPartsFromIntervention(
      {
        problem: "Cylindre cassé",
        title: "Dépannage",
        category: "serrurerie",
      },
      locksmithStockCatalogRows()
    );

    expect(part.reference).toBeTruthy();
    expect(part.imageUrl).toBeTruthy();
    expect(part.stockItemId).toBeTruthy();
  });
});
