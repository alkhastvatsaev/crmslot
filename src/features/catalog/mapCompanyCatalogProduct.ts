import type { CatalogProduct as CompanyProduct } from "@/features/catalog/types";
import type { CatalogProduct as QuickAddProduct } from "@/features/catalog/productQuickAdd";

export function companyProductToQuickAdd(p: CompanyProduct): QuickAddProduct {
  return {
    sku: p.sku.trim(),
    label: p.label.trim(),
    unitPriceCents: p.unitPriceCents,
    category: p.category?.trim() || undefined,
  };
}

export function firestoreProductToQuickAdd(data: Record<string, unknown>): QuickAddProduct | null {
  const sku = String(data.sku ?? "").trim();
  const label = String(data.label ?? "").trim();
  if (!sku || !label) return null;
  const unitPriceCents =
    typeof data.unitPriceCents === "number"
      ? data.unitPriceCents
      : Math.round(Number(data.unitPrice ?? 0) * 100);
  const category = typeof data.category === "string" ? data.category.trim() : undefined;
  return { sku, label, unitPriceCents, category: category || undefined };
}
