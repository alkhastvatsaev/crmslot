import type { CatalogProduct } from "@/features/catalog/productQuickAdd";

/** Catalogue démo Lecot (remplacé par API quand LECOT_API_URL est configuré). */
export const LECOT_CATALOG: CatalogProduct[] = [
  { sku: "LEC-1001", label: "Vis à bois tête fraisée 4x40mm (Boîte 200)", unitPriceCents: 1250, category: "quincaillerie" },
  { sku: "LEC-1002", label: "Vis à bois tête fraisée 5x60mm (Boîte 200)", unitPriceCents: 1800, category: "quincaillerie" },
  { sku: "LEC-2001", label: "Serrure multipoints à encastrer 3 points", unitPriceCents: 14500, category: "serrurerie" },
  { sku: "LEC-2002", label: "Serrure en applique monopoint", unitPriceCents: 4500, category: "serrurerie" },
  { sku: "LEC-3001", label: "Cylindre européen de sécurité 30x30", unitPriceCents: 3500, category: "serrurerie" },
  { sku: "LEC-3002", label: "Cylindre européen débrayable 40x40", unitPriceCents: 5500, category: "serrurerie" },
  { sku: "LEC-4001", label: "Poignée de porte sur rosace Inox", unitPriceCents: 2500, category: "serrurerie" },
  { sku: "LEC-5001", label: "Mousse expansive polyuréthane 750ml", unitPriceCents: 950 },
  { sku: "LEC-5002", label: "Silicone neutre transparent 310ml", unitPriceCents: 650 },
];
