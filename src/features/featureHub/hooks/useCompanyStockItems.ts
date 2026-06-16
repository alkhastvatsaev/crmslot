"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { subscribeStockItems, type StockItem } from "@/features/materials/stockFirestore";

export function useCompanyStockItems(companyId: string | null) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));

  useEffect(() => {
    if (!companyId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeStockItems(companyId, (rows) => {
      setItems(rows);
      setLoading(false);
    });
  }, [companyId]);

  const patchDemoItem = useCallback((_id: string, _patch: Partial<StockItem>) => {}, []);
  const adjustDemoQuantity = useCallback((_id: string, _delta: number) => {}, []);

  return {
    items,
    loading,
    isPreviewCatalog: false,
    hasLiveStock: items.length > 0,
    patchDemoItem,
    adjustDemoQuantity,
  };
}
