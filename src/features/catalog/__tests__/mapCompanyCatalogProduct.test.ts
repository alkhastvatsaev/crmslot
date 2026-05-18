import { firestoreProductToQuickAdd } from "@/features/catalog/mapCompanyCatalogProduct";

describe("firestoreProductToQuickAdd", () => {
  it("maps firestore doc to quick-add shape", () => {
    expect(
      firestoreProductToQuickAdd({
        sku: "REF-1",
        label: "Produit test",
        unitPriceCents: 1999,
        category: "serrurerie",
      }),
    ).toEqual({
      sku: "REF-1",
      label: "Produit test",
      unitPriceCents: 1999,
      category: "serrurerie",
    });
  });

  it("returns null when sku or label missing", () => {
    expect(firestoreProductToQuickAdd({ label: "x" })).toBeNull();
  });
});
