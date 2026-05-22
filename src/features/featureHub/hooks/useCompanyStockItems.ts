"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  demoStockItemsForCompany,
  isDemoStockItemId,
} from "@/features/dev/demoCompanyStock";
import { subscribeStockItems, type StockItem } from "@/features/materials/stockFirestore";

export function useCompanyStockItems(companyId: string | null) {
  const [liveItems, setLiveItems] = useState<StockItem[]>([]);
  const [demoOverrides, setDemoOverrides] = useState<Record<string, Partial<StockItem>>>({});
  const [loading, setLoading] = useState(Boolean(companyId));

  useEffect(() => {
    if (!companyId) {
      setLiveItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeStockItems(companyId, (rows) => {
      setLiveItems(rows);
      setLoading(false);
    });
  }, [companyId]);

  const isPreviewCatalog = liveItems.length === 0 && Boolean(companyId);

  const items = useMemo(() => {
    const base =
      liveItems.length > 0
        ? liveItems
        : companyId
          ? demoStockItemsForCompany(companyId)
          : [];
    return base.map((row) => {
      const patch = demoOverrides[row.id];
      return patch ? { ...row, ...patch } : row;
    });
  }, [liveItems, companyId, demoOverrides]);

  const patchDemoItem = useCallback((id: string, patch: Partial<StockItem>) => {
    if (!isDemoStockItemId(id)) return;
    setDemoOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const adjustDemoQuantity = useCallback(
    (id: string, delta: number) => {
      const row = items.find((i) => i.id === id);
      if (!row) return;
      patchDemoItem(id, { quantity: Math.max(0, row.quantity + delta) });
    },
    [items, patchDemoItem],
  );

  return {
    items,
    loading,
    isPreviewCatalog,
    hasLiveStock: liveItems.length > 0,
    patchDemoItem,
    adjustDemoQuantity,
  };
}
