import { enrichLecotOrderLinesWithCatalogPrices } from "@/features/chatbot/chatbot-lecot-order-lines";
import type { SupplierOrderLine } from "@/features/suppliers";

describe("enrichLecotOrderLinesWithCatalogPrices", () => {
  it("résout la vignette via la référence stock inventaire quand le SKU commandé diffère", async () => {
    const lines: SupplierOrderLine[] = [
      {
        sku: "CUSTOM-CYLINDRE-EUROPEEN-80",
        label: "Cylindre européen 80 mm sécurité",
        quantity: 1,
        unitPriceCents: 8900,
      },
    ];

    const enriched = await enrichLecotOrderLinesWithCatalogPrices("company-1", lines, {
      stockReference: "CYL-EURO-80",
    });

    expect(enriched[0]?.imageUrl).toBeTruthy();
  });

  it("conserve imageUrl déjà fournie", async () => {
    const lines: SupplierOrderLine[] = [
      {
        sku: "LEC-CYL-2012",
        label: "Cylindre",
        quantity: 1,
        unitPriceCents: 8900,
        imageUrl: "https://cdn.example/known.png",
      },
    ];

    const enriched = await enrichLecotOrderLinesWithCatalogPrices("company-1", lines);
    expect(enriched[0]?.imageUrl).toBe("https://cdn.example/known.png");
  });
});
