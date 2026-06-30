import {
  parseMaterialOrderStockReference,
  parseStockCenterMaterialOrderIntent,
} from "@/features/materials/interventionMaterialOrderPrompt";

describe("parseStockCenterMaterialOrderIntent", () => {
  it("parse le prompt modal stock central avec référence", () => {
    expect(
      parseStockCenterMaterialOrderIntent(
        'Commander 2× "Cylindre européen 80 mm sécurité" (réf. CYL-EURO-80) — société : ACME Serrurerie'
      )
    ).toEqual({
      quantity: 2,
      description: "Cylindre européen 80 mm sécurité",
      reference: "CYL-EURO-80",
      companyName: "ACME Serrurerie",
    });
  });

  it("accepte sans référence", () => {
    expect(
      parseStockCenterMaterialOrderIntent('Commander 1× "Poignée Hoppe" — société : Demo')
    ).toEqual({
      quantity: 1,
      description: "Poignée Hoppe",
      reference: null,
      companyName: "Demo",
    });
  });
});

describe("parseMaterialOrderStockReference", () => {
  it("priorise la référence stock central", () => {
    expect(
      parseMaterialOrderStockReference(
        'Commander 1× "Cylindre" (réf. CYL-EURO-80) — société : ACME'
      )
    ).toBe("CYL-EURO-80");
  });
});
