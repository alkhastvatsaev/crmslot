import type { Intervention } from "@/features/interventions/types";

export type CatalogProduct = {
  sku: string;
  label: string;
  unitPriceCents: number;
  category?: string;
};

/** Stub catalogue — remplacer par API Lecot quand `lecotProductSearch` est activé. */
export const STUB_CATALOG: CatalogProduct[] = [
  { sku: "CYL-A2P", label: "Cylindre A2P", unitPriceCents: 8900, category: "serrurerie" },
  { sku: "SERR-3PT", label: "Serrure 3 points", unitPriceCents: 24500, category: "serrurerie" },
  { sku: "MAIN-DIV", label: "Main-d'œuvre déplacement", unitPriceCents: 7500 },
];

export function filterCatalogForIntervention(
  products: CatalogProduct[],
  iv: Pick<Intervention, "category" | "problem">,
): CatalogProduct[] {
  const cat = iv.category?.trim();
  if (!cat) return products;
  const filtered = products.filter((p) => !p.category || p.category === cat);
  return filtered.length > 0 ? filtered : products;
}

export function catalogLineFromProduct(p: CatalogProduct, qty = 1) {
  return {
    description: p.label,
    quantity: qty,
    unitPriceCents: p.unitPriceCents,
    reference: p.sku,
  };
}
