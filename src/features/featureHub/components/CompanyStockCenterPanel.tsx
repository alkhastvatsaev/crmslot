"use client";

import { useCallback, useMemo, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyStockIntent } from "@/context/CompanyStockIntentContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import CompanyStockItemList from "@/features/featureHub/components/CompanyStockItemList";
import CompanyStockOrderModal from "@/features/featureHub/components/CompanyStockOrderModal";
import { useCompanyStockImages } from "@/features/featureHub/hooks/useCompanyStockImages";
import type { StockCategoryId } from "@/features/featureHub/companyStockCategories";
import {
  applyStockListFilters,
  buildOpenOrderReferenceSet,
} from "@/features/featureHub/filterCompanyStock";
import type { StockItem } from "@/features/materials/stockFirestore";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import { dispatchMaterialAgentQuickPrompt } from "@/features/featureHub/companyStockChatbot";

type Props = {
  items: StockItem[];
  orders: MaterialOrderDoc[];
  category: StockCategoryId | "all";
  loading: boolean;
  isPreviewCatalog?: boolean;
};

/** Panneau central Matériel — grille stock (tuiles carrées). */
export default function CompanyStockCenterPanel({
  items,
  orders,
  category,
  loading,
  isPreviewCatalog = false,
}: Props) {
  const { t } = useTranslation();
  const { selectedStockItemId, setSelectedStockItemId } = useCompanyStockIntent();
  const workspace = useCompanyWorkspaceOptional();

  const [orderingItem, setOrderingItem] = useState<StockItem | null>(null);

  const openOrderRefs = useMemo(() => buildOpenOrderReferenceSet(orders), [orders]);

  const listRows = useMemo(
    () =>
      applyStockListFilters(items, {
        filter: "all",
        category,
        search: "",
        openOrderRefs,
      }),
    [items, category, openOrderRefs]
  );

  const imageUrls = useCompanyStockImages(listRows);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedStockItemId(id);
      const item = listRows.find((i) => i.id === id);
      if (item) setOrderingItem(item);
    },
    [setSelectedStockItemId, listRows]
  );

  const handleConfirmOrder = useCallback(
    (qty: number) => {
      if (!orderingItem) return;
      const ref = orderingItem.reference?.trim();
      const companyName =
        workspace?.memberships.find((m) => m.companyId === workspace.activeCompanyId)
          ?.companyName ?? "";
      const parts = [
        `Commander ${qty}×`,
        `"${orderingItem.description}"`,
        ref ? `(réf. ${ref})` : null,
        companyName ? `— société : ${companyName}` : null,
      ].filter(Boolean);
      dispatchMaterialAgentQuickPrompt(parts.join(" "));
    },
    [orderingItem, workspace]
  );

  if (loading) {
    return (
      <div
        data-testid="company-stock-center"
        className="flex min-h-0 flex-1 items-center justify-center"
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <>
      <div
        data-testid="company-stock-center"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {isPreviewCatalog ? (
          <p
            data-testid="company-stock-preview-banner"
            className="mb-2 shrink-0 rounded-[12px] border border-teal-100/90 bg-teal-50/70 px-3 py-2 text-center text-[11px] font-medium text-teal-900"
          >
            {t("companyStock.pro_preview_short")}
          </p>
        ) : null}
        <button
          type="button"
          data-testid="company-stock-lecot-catalog"
          onClick={() => dispatchMaterialAgentQuickPrompt("catalogue lecot")}
          className="mb-2 flex shrink-0 items-center justify-between gap-2 rounded-[14px] border border-slate-200/90 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-teal-200 hover:bg-teal-50/40"
        >
          <span className="min-w-0">
            <span className="block text-[13px] font-bold text-slate-900">Lecot.be</span>
            <span className="block text-[11px] text-slate-500">{t("catalog.open_catalog")}</span>
          </span>
          <ExternalLink className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
        </button>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          <CompanyStockItemList
            items={listRows}
            selectedId={selectedStockItemId}
            onSelect={handleSelect}
            imageUrls={imageUrls}
          />
        </div>
      </div>

      <CompanyStockOrderModal
        item={orderingItem}
        imageUrl={
          orderingItem
            ? orderingItem.imageUrl?.trim() || imageUrls?.[orderingItem.id] || null
            : null
        }
        onClose={() => setOrderingItem(null)}
        onConfirm={handleConfirmOrder}
      />
    </>
  );
}
