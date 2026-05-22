import { inferStockCategory, type StockCategoryId } from "@/features/featureHub/companyStockCategories";
import { sortStockByPatronPriority } from "@/features/featureHub/companyStockMetrics";
import type { StockItem } from "@/features/materials/stockFirestore";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";

export type CompanyStockFilter = "all" | "low" | "out" | "orders" | "lecot";

export function isLowStockItem(item: StockItem): boolean {
  return item.quantity <= item.alertThreshold;
}

export function filterStockItemsBySearch(items: StockItem[], query: string): StockItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const tokens = q.split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const hay = `${item.reference} ${item.description} ${item.unit}`.toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}

export function filterStockByChip(
  items: StockItem[],
  filter: CompanyStockFilter,
  openOrderRefs: Set<string>,
): StockItem[] {
  switch (filter) {
    case "low":
      return items.filter((i) => i.quantity > 0 && isLowStockItem(i));
    case "out":
      return items.filter((i) => i.quantity <= 0);
    case "orders":
      return items.filter(
        (i) => openOrderRefs.has(i.reference.toLowerCase()) || openOrderRefs.has(i.id),
      );
    case "lecot":
      return items.filter((i) => /lecot|lec-/i.test(i.reference) || /lecot/i.test(i.description));
    default:
      return items;
  }
}

export function filterStockByCategory(
  items: StockItem[],
  category: StockCategoryId | "all",
): StockItem[] {
  if (category === "all") return items;
  return items.filter((i) => inferStockCategory(i) === category);
}

export function applyStockListFilters(
  items: StockItem[],
  opts: {
    filter: CompanyStockFilter;
    category: StockCategoryId | "all";
    search: string;
    openOrderRefs: Set<string>;
  },
): StockItem[] {
  let rows = filterStockByChip(items, opts.filter, opts.openOrderRefs);
  rows = filterStockByCategory(rows, opts.category);
  rows = filterStockItemsBySearch(rows, opts.search);
  return sortStockByPatronPriority(rows);
}

export function materialOrdersMatchingStock(
  orders: MaterialOrderDoc[],
  item: StockItem,
): MaterialOrderDoc[] {
  const ref = item.reference.trim().toLowerCase();
  const desc = item.description.trim().toLowerCase();
  return orders.filter((o) =>
    (o.partsRequested ?? []).some((p) => {
      const pr = (p.reference ?? "").trim().toLowerCase();
      const pl = (p.description ?? "").trim().toLowerCase();
      return (ref && pr === ref) || (desc && pl.includes(desc)) || (desc && desc.includes(pl));
    }),
  );
}

export function buildOpenOrderReferenceSet(orders: MaterialOrderDoc[]): Set<string> {
  const refs = new Set<string>();
  for (const o of orders) {
    if (o.status !== "pending" && o.status !== "ordered") continue;
    for (const p of o.partsRequested ?? []) {
      const r = (p.reference ?? "").trim().toLowerCase();
      if (r) refs.add(r);
    }
    refs.add(o.id);
  }
  return refs;
}
