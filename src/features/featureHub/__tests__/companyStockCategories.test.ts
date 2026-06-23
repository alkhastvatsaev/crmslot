import { inferStockCategory } from "@/features/featureHub/companyStockCategories";
import type { StockItem } from "@/features/materials";

function item(description: string, reference = ""): StockItem {
  return {
    id: "x",
    companyId: "co",
    reference,
    description,
    quantity: 1,
    alertThreshold: 5,
    unit: "pcs",
    updatedAt: "",
  };
}

describe("companyStockCategories", () => {
  it("infers locksmith families from labels", () => {
    expect(inferStockCategory(item("Cylindre européen"))).toBe("cylinder");
    expect(inferStockCategory(item("Serrure multipoint"))).toBe("lock");
    expect(inferStockCategory(item("Clé badge RFID"))).toBe("key");
    expect(inferStockCategory(item("Vis inox"))).toBe("hardware");
    expect(inferStockCategory(item("Gants nitrile"))).toBe("consumable");
    expect(inferStockCategory(item("Divers"))).toBe("other");
  });
});
