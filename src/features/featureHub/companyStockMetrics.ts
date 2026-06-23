import {
  inferStockCategory,
  type StockCategoryId,
} from "@/features/featureHub/companyStockCategories";
import { isLowStockItem } from "@/features/featureHub/filterCompanyStock";
import type { MaterialOrderDoc } from "@/features/materials";
import type { StockItem } from "@/features/materials";
import type { SupplierOrder } from "@/features/suppliers";

export type StockHealth = "ok" | "low" | "out";

export function stockHealth(item: StockItem): StockHealth {
  if (item.quantity <= 0) return "out";
  if (isLowStockItem(item)) return "low";
  return "ok";
}

export function sortStockByPatronPriority(items: StockItem[]): StockItem[] {
  const rank = (item: StockItem) => {
    const h = stockHealth(item);
    if (h === "out") return 0;
    if (h === "low") return 1;
    return 2;
  };
  return [...items].sort(
    (a, b) => rank(a) - rank(b) || a.description.localeCompare(b.description, "fr")
  );
}

export type CompanyStockDashboardMetrics = {
  totalSkus: number;
  outCount: number;
  lowCount: number;
  okCount: number;
  coveragePct: number;
  pendingFieldOrders: number;
  openSupplierOrders: number;
  waitingMaterialJobs: number;
  byCategory: Record<StockCategoryId, number>;
};

export function computeCompanyStockMetrics(
  items: StockItem[],
  materialOrders: MaterialOrderDoc[],
  supplierOrders: SupplierOrder[],
  waitingMaterialJobs: number
): CompanyStockDashboardMetrics {
  const outCount = items.filter((i) => i.quantity <= 0).length;
  const lowCount = items.filter((i) => i.quantity > 0 && isLowStockItem(i)).length;
  const okCount = items.length - outCount - lowCount;
  const totalSkus = items.length;
  const coveragePct = totalSkus > 0 ? Math.round((okCount / totalSkus) * 100) : 100;

  const byCategory = {} as Record<StockCategoryId, number>;
  for (const item of items) {
    const cat = inferStockCategory(item);
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
  }

  const pendingFieldOrders = materialOrders.filter((o) => o.status === "pending").length;
  const openSupplierOrders = supplierOrders.filter(
    (o) => o.status === "sent" || o.status === "confirmed" || o.status === "draft"
  ).length;

  return {
    totalSkus,
    outCount,
    lowCount,
    okCount,
    coveragePct,
    pendingFieldOrders,
    openSupplierOrders,
    waitingMaterialJobs,
    byCategory,
  };
}
