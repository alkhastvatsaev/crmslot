import {
  matchStockCatalogImageLookup,
  resolveOrderLineImageLookup,
} from "@/features/catalog/matchStockCatalogImageLookup";

describe("matchStockCatalogImageLookup", () => {
  it("matches stock reference directly", () => {
    expect(
      matchStockCatalogImageLookup({
        reference: "GACH-ELEC",
        description: "Gâche électrique réversible",
      })
    ).toEqual({
      reference: "GACH-ELEC",
      lecotSku: "LEC-CTL-4003",
      description: "Gâche électrique réversible",
    });
  });

  it("matches descriptive label to stock item", () => {
    expect(
      matchStockCatalogImageLookup({
        sku: "A1",
        label: "Cylindre européen 80 mm sécurité",
      })
    ).toEqual({
      reference: "CYL-EURO-80",
      lecotSku: "LEC-CYL-2012",
      description: "Cylindre européen 80 mm sécurité",
    });
  });

  it("does not guess from short generic label", () => {
    expect(
      matchStockCatalogImageLookup({
        sku: "A1",
        label: "Cylindre",
      })
    ).toBeNull();
  });

  it("matches lecot sku from overlay", () => {
    expect(
      matchStockCatalogImageLookup({
        sku: "LEC-CYL-2012",
        label: "Cylindre",
      })
    ).toEqual({
      reference: "LEC-CYL-2012",
      lecotSku: "LEC-CYL-2012",
      description: "Cylindre",
    });
  });
});

describe("resolveOrderLineImageLookup", () => {
  it("does not treat generic sku as lecot sku when no match", () => {
    expect(
      resolveOrderLineImageLookup({
        sku: "A1",
        label: "Cylindre",
        fallbackId: "ord-1",
      })
    ).toEqual({
      reference: "A1",
      description: "Cylindre",
      lecotSku: null,
    });
  });
});
