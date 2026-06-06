import {
  CircleDot,
  Droplets,
  KeyRound,
  Lock,
  Package,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { StockCategoryId } from "@/features/featureHub/companyStockCategories";

/** Clés i18n `companyStock.cat_*` — une famille = une identité visuelle. */
export const STOCK_CATEGORY_LABEL_KEY: Record<StockCategoryId, string> = {
  cylinder: "companyStock.cat_cylinder",
  lock: "companyStock.cat_lock",
  key: "companyStock.cat_key",
  hardware: "companyStock.cat_hardware",
  consumable: "companyStock.cat_consumable",
  other: "companyStock.cat_other",
};

export const STOCK_CATEGORY_ICON: Record<StockCategoryId, LucideIcon> = {
  cylinder: CircleDot,
  lock: Lock,
  key: KeyRound,
  hardware: Wrench,
  consumable: Droplets,
  other: Package,
};

/** Pastille famille (coin supérieur). */
export const STOCK_CATEGORY_BADGE: Record<StockCategoryId, string> = {
  cylinder: "border-violet-200/90 bg-violet-100 text-violet-800",
  lock: "border-sky-200/90 bg-sky-100 text-sky-800",
  key: "border-amber-200/90 bg-amber-100 text-amber-900",
  hardware: "border-zinc-200/90 bg-zinc-100 text-zinc-800",
  consumable: "border-emerald-200/90 bg-emerald-100 text-emerald-800",
  other: "border-slate-200/90 bg-slate-100 text-slate-700",
};

/** Médaillon pictogramme — taille héro, couleur par famille (pas par santé stock). */
export const STOCK_CATEGORY_ICON_WELL: Record<StockCategoryId, string> = {
  cylinder: "border-violet-300/80 bg-violet-50 text-violet-700",
  lock: "border-sky-300/80 bg-sky-50 text-sky-700",
  key: "border-amber-300/80 bg-amber-50 text-amber-800",
  hardware: "border-zinc-300/80 bg-zinc-50 text-zinc-700",
  consumable: "border-emerald-300/80 bg-emerald-50 text-emerald-700",
  other: "border-slate-300/80 bg-slate-50 text-slate-600",
};
