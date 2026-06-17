"use client";

import { useEffect, useMemo, useState } from "react";
import { locksmithStockCatalogRows } from "@/features/catalog/locksmithStockSeedCatalog";
import { subscribeStockItems, type StockItem } from "@/features/materials/stockFirestore";

export function useCompanyStockItems(companyId: string | null) {
  const [liveItems, setLiveItems] = useState<StockItem[]>([]);
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
    if (liveItems.length > 0) return liveItems;
    if (!companyId) return [];
    return locksmithStockCatalogRows().map((row) => ({ ...row, companyId }));
  }, [liveItems, companyId]);

  return {
    items,
    loading,
    isPreviewCatalog,
    hasLiveStock: liveItems.length > 0,
    patchDemoItem: () => {},
    adjustDemoQuantity: () => {},
  };
}
