"use client";

import { useEffect, useMemo, useRef } from "react";
import { useCompanyStockIntent } from "@/context/CompanyStockIntentContext";
import {
  pickFocusStockItemId,
  resolveAutopilotPlan,
  resolveSmartFilter,
} from "@/features/featureHub/companyStockAutopilot";
import type { CompanyStockDashboardMetrics } from "@/features/featureHub/companyStockMetrics";
import { buildOpenOrderReferenceSet } from "@/features/featureHub/filterCompanyStock";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import type { StockItem } from "@/features/materials/stockFirestore";
import type { SupplierOrder } from "@/features/suppliers/types";

type Input = {
  companyId: string;
  items: StockItem[];
  orders: MaterialOrderDoc[];
  supplierOrders: SupplierOrder[];
  metrics: CompanyStockDashboardMetrics;
  loading: boolean;
};

/** Sélection intelligente au chargement ; liste toujours en vue « tout » + recherche. */
export function useCompanyStockAutopilot({
  companyId,
  items,
  orders,
  supplierOrders,
  metrics,
  loading,
}: Input) {
  const { selectedStockItemId, setSelectedStockItemId } = useCompanyStockIntent();
  const bootstrappedFor = useRef<string | null>(null);

  const openOrderRefs = useMemo(() => buildOpenOrderReferenceSet(orders), [orders]);
  const smartFilter = useMemo(() => resolveSmartFilter(metrics), [metrics]);

  const selected = useMemo(
    () => items.find((i) => i.id === selectedStockItemId) ?? null,
    [items, selectedStockItemId],
  );

  const plan = useMemo(
    () =>
      resolveAutopilotPlan({
        items,
        orders,
        supplierOrders,
        metrics,
        selected,
      }),
    [items, orders, supplierOrders, metrics, selected],
  );

  useEffect(() => {
    if (loading || !companyId) return;
    if (bootstrappedFor.current === companyId) return;
    bootstrappedFor.current = companyId;
    const focusId = pickFocusStockItemId(items, smartFilter, openOrderRefs);
    if (focusId) setSelectedStockItemId(focusId);
  }, [loading, companyId, smartFilter, items, openOrderRefs, setSelectedStockItemId]);

  useEffect(() => {
    if (loading || !companyId) return;
    const focusId = pickFocusStockItemId(items, smartFilter, openOrderRefs);
    if (!focusId) return;
    const selectedStillInList =
      selectedStockItemId && items.some((i) => i.id === selectedStockItemId);
    if (!selectedStillInList) setSelectedStockItemId(focusId);
  }, [
    loading,
    companyId,
    smartFilter,
    items,
    openOrderRefs,
    selectedStockItemId,
    setSelectedStockItemId,
  ]);

  return { plan, smartFilter, selected };
}
