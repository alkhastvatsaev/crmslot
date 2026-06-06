"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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
};

/** Panneau central Matériel — grille stock (tuiles carrées). */
export default function CompanyStockCenterPanel({ items, orders, category, loading }: Props) {
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
