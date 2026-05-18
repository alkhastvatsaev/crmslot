import type { CatalogProduct } from "@/features/catalog/productQuickAdd";

export function mergeCatalogProducts(...lists: CatalogProduct[][]): CatalogProduct[] {
  const bySku = new Map<string, CatalogProduct>();
  for (const list of lists) {
    for (const p of list) {
      const sku = p.sku.trim();
      if (!sku) continue;
      if (!bySku.has(sku)) bySku.set(sku, p);
    }
  }
  return Array.from(bySku.values());
}

export function searchCatalogProducts(
  products: CatalogProduct[],
  query: string,
  limit = 12,
): CatalogProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return products.slice(0, limit);
  const matches = products.filter(
    (p) => p.label.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
  );
  return matches.slice(0, limit);
}
