"use client";

import {
  CircleSlash,
  KeyRound,
  Lock,
  Package,
  TrendingDown,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { inferStockCategory, type StockCategoryId } from "@/features/featureHub/companyStockCategories";
import { stockHealth } from "@/features/featureHub/companyStockMetrics";
import { sortStockByPatronPriority } from "@/features/featureHub/companyStockMetrics";
import {
  STOCK_HEALTH_BAR,
  STOCK_HEALTH_CARD_BG,
  STOCK_HEALTH_CARD_BORDER,
  STOCK_HEALTH_ICON,
  STOCK_HEALTH_ICON_BG,
  STOCK_HEALTH_STRIPE,
} from "@/features/featureHub/companyStockVisualTheme";
import type { StockItem } from "@/features/materials/stockFirestore";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

const CATEGORY_ICON: Record<StockCategoryId, LucideIcon> = {
  cylinder: Lock,
  lock: Lock,
  key: KeyRound,
  hardware: Wrench,
  consumable: Package,
  other: Package,
};

type Props = {
  items: StockItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function fillRatio(item: StockItem): number {
  const cap = Math.max(item.alertThreshold, item.quantity, 1);
  return Math.min(100, Math.round((item.quantity / cap) * 100));
}

export default function CompanyStockItemList({ items, selectedId, onSelect }: Props) {
  const { t } = useTranslation();
  const sorted = sortStockByPatronPriority(items);

  if (sorted.length === 0) {
    return (
      <p
        data-testid="company-stock-list-empty"
        className="py-16 text-center text-[12px] text-slate-400"
      >
        {t("companyStock.empty_filter")}
      </p>
    );
  }

  return (
    <ul
      data-testid="company-stock-list"
      className="flex flex-col gap-1.5 p-2"
      style={outfit}
    >
      {sorted.map((item) => {
        const health = stockHealth(item);
        const active = item.id === selectedId;
        const CatIcon = CATEGORY_ICON[inferStockCategory(item)];
        const ratio = fillRatio(item);
        const HealthIcon =
          health === "out" ? CircleSlash : health === "low" ? TrendingDown : Package;

        return (
          <li key={item.id}>
            <button
              type="button"
              data-testid={`company-stock-card-${item.id}`}
              data-health={health}
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex w-full items-stretch gap-0 overflow-hidden rounded-[14px] border text-left transition",
                active
                  ? "border-slate-300 bg-slate-50 shadow-sm ring-1 ring-slate-200/80"
                  : STOCK_HEALTH_CARD_BORDER[health],
                !active && STOCK_HEALTH_CARD_BG[health],
                !active && "hover:brightness-[0.99]",
              )}
            >
              <span className={cn("w-1 shrink-0", STOCK_HEALTH_STRIPE[health])} aria-hidden />
              <span className="flex min-w-0 flex-1 flex-col gap-2 px-3 py-2.5">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border",
                      STOCK_HEALTH_ICON_BG[health],
                    )}
                  >
                    <CatIcon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-800">
                      {item.description}
                    </span>
                    {item.reference ? (
                      <span className="block truncate text-[10px] tabular-nums text-slate-400">
                        {item.reference}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="flex items-center gap-1 text-[15px] font-bold tabular-nums text-slate-800">
                      <HealthIcon
                        className={cn("h-3.5 w-3.5", STOCK_HEALTH_ICON[health])}
                        aria-hidden
                      />
                      {item.quantity}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400">
                      / {item.alertThreshold}
                    </span>
                  </span>
                </span>
                <span
                  className="h-1 overflow-hidden rounded-full bg-slate-100"
                  role="presentation"
                >
                  <span
                    className={cn("block h-full rounded-full", STOCK_HEALTH_BAR[health])}
                    style={{ width: `${ratio}%` }}
                  />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
