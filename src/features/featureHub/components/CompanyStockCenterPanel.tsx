"use client";

import { useMemo } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyStockIntent } from "@/context/CompanyStockIntentContext";
import CompanyStockItemList from "@/features/featureHub/components/CompanyStockItemList";
import type { StockCategoryId } from "@/features/featureHub/companyStockCategories";
import {
  applyStockListFilters,
  buildOpenOrderReferenceSet,
} from "@/features/featureHub/filterCompanyStock";
import type { StockItem } from "@/features/materials/stockFirestore";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

type Props = {
  items: StockItem[];
  orders: MaterialOrderDoc[];
  category: StockCategoryId | "all";
  loading: boolean;
};

/** Panneau central Matériel — recherche + liste stock uniquement. */
export default function CompanyStockCenterPanel({
  items,
  orders,
  category,
  loading,
}: Props) {
  const { t } = useTranslation();
  const { search, setSearch, selectedStockItemId, setSelectedStockItemId } =
    useCompanyStockIntent();

  const openOrderRefs = useMemo(() => buildOpenOrderReferenceSet(orders), [orders]);

  const listRows = useMemo(
    () =>
      applyStockListFilters(items, {
        filter: "all",
        category,
        search,
        openOrderRefs,
      }),
    [items, category, search, openOrderRefs],
  );

  if (loading) {
    return (
      <div
        data-testid="company-stock-center"
        className="flex min-h-0 flex-1 items-center justify-center"
        style={outfit}
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div
      data-testid="company-stock-center"
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
      style={outfit}
    >
      <div className="relative shrink-0" data-testid="company-stock-search">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={String(t("companyStock.search_placeholder"))}
          placeholder="…"
          className="h-10 rounded-[14px] border-slate-200/80 bg-white pl-9 text-[12px] shadow-none focus-visible:border-slate-200/80 focus-visible:ring-0 focus-visible:ring-transparent"
        />
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto rounded-[16px] border border-slate-200/70 bg-white/60">
        <CompanyStockItemList
          items={listRows}
          selectedId={selectedStockItemId}
          onSelect={setSelectedStockItemId}
        />
      </div>
    </div>
  );
}
