"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  inferStockCategory,
  type StockCategoryId,
} from "@/features/featureHub/companyStockCategories";
import { STOCK_CATEGORY_ICON } from "@/features/featureHub/companyStockCategoryVisual";
import type { StockImageMap } from "@/features/featureHub/hooks/useCompanyStockImages";
import { sortStockByPatronPriority, stockHealth } from "@/features/featureHub/companyStockMetrics";
import {
  STOCK_HEALTH_TILE_SHADOW,
  STOCK_HEALTH_TILE_SHADOW_ACTIVE,
} from "@/features/featureHub/companyStockVisualTheme";
import type { StockItem } from "@/features/materials";

type Props = {
  items: StockItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  imageUrls?: StockImageMap;
};

function StockTileVisual({
  itemId,
  category,
  imageUrl,
}: {
  itemId: string;
  category: StockCategoryId;
  imageUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const CatIcon = STOCK_CATEGORY_ICON[category];
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <span className="relative flex h-[70%] w-[70%] items-center justify-center">
      {showImage ? (
        <img
          data-testid={`company-stock-card-image-${itemId}`}
          src={imageUrl ?? undefined}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <CatIcon className="h-[24px] w-[24px] text-slate-400" strokeWidth={1.5} aria-hidden />
      )}
    </span>
  );
}

/** Grille de tuiles carrées 3×3 — inventaire page Matériel (panneau central). */
export default function CompanyStockItemList({ items, selectedId, onSelect, imageUrls }: Props) {
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
      data-layout="grid-3"
      className="grid grid-cols-3 gap-2 p-2"
    >
      {sorted.map((item) => {
        const health = stockHealth(item);
        const active = item.id === selectedId;
        const category = inferStockCategory(item);
        const resolvedImageUrl = item.imageUrl?.trim() || imageUrls?.[item.id] || null;

        return (
          <li key={item.id} className="min-w-0 p-1">
            <button
              type="button"
              data-testid={`company-stock-card-${item.id}`}
              data-health={health}
              data-category={category}
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex aspect-square w-full flex-col overflow-hidden rounded-[12px] bg-white p-1.5 text-left transition",
                active ? STOCK_HEALTH_TILE_SHADOW_ACTIVE[health] : STOCK_HEALTH_TILE_SHADOW[health]
              )}
            >
              <span className="flex min-h-0 flex-1 items-center justify-center">
                <StockTileVisual
                  key={`${item.id}-${resolvedImageUrl ?? "icon"}`}
                  itemId={item.id}
                  category={category}
                  imageUrl={resolvedImageUrl}
                />
              </span>

              <span
                data-testid={`company-stock-card-title-${item.id}`}
                className="mt-1.5 line-clamp-2 text-center text-[10px] font-semibold leading-snug text-slate-900"
              >
                {item.description}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
