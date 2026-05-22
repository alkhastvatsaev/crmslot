"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CompanyStockFilter } from "@/features/featureHub/filterCompanyStock";

export type CompanyStockFocusDetail = {
  stockItemId?: string | null;
  filter?: CompanyStockFilter;
  searchQuery?: string | null;
};

type CompanyStockIntentApi = {
  filter: CompanyStockFilter;
  setFilter: (f: CompanyStockFilter) => void;
  search: string;
  setSearch: (q: string) => void;
  selectedStockItemId: string | null;
  setSelectedStockItemId: (id: string | null) => void;
  pendingChatPrompt: string | null;
  setPendingChatPrompt: (text: string | null) => void;
  applyFocus: (detail: CompanyStockFocusDetail) => void;
};

const CompanyStockIntentContext = createContext<CompanyStockIntentApi | null>(null);

export const BELGMAP_FOCUS_STOCK_HUB_EVENT = "belgmap-focus-stock-hub";

export function CompanyStockIntentProvider({ children }: { children: ReactNode }) {
  const [filter, setFilterState] = useState<CompanyStockFilter>("all");
  const [search, setSearchState] = useState("");
  const [selectedStockItemId, setSelectedStockItemIdState] = useState<string | null>(null);
  const [pendingChatPrompt, setPendingChatPromptState] = useState<string | null>(null);

  const setFilter = useCallback((f: CompanyStockFilter) => setFilterState(f), []);
  const setSearch = useCallback((q: string) => setSearchState(q), []);
  const setSelectedStockItemId = useCallback((id: string | null) => {
    setSelectedStockItemIdState(id?.trim() ? id.trim() : null);
  }, []);
  const setPendingChatPrompt = useCallback((text: string | null) => {
    setPendingChatPromptState(text?.trim() ? text.trim() : null);
  }, []);

  const applyFocus = useCallback((detail: CompanyStockFocusDetail) => {
    if (detail.stockItemId) setSelectedStockItemIdState(detail.stockItemId.trim());
    if (detail.filter) setFilterState(detail.filter);
    if (detail.searchQuery != null) setSearchState(detail.searchQuery.trim());
  }, []);

  useEffect(() => {
    const onFocus = (e: Event) => {
      const detail = (e as CustomEvent<CompanyStockFocusDetail>).detail;
      if (!detail) return;
      applyFocus(detail);
    };
    window.addEventListener(BELGMAP_FOCUS_STOCK_HUB_EVENT, onFocus);
    return () => window.removeEventListener(BELGMAP_FOCUS_STOCK_HUB_EVENT, onFocus);
  }, [applyFocus]);

  const value = useMemo(
    () => ({
      filter,
      setFilter,
      search,
      setSearch,
      selectedStockItemId,
      setSelectedStockItemId,
      pendingChatPrompt,
      setPendingChatPrompt,
      applyFocus,
    }),
    [
      filter,
      setFilter,
      search,
      setSearch,
      selectedStockItemId,
      setSelectedStockItemId,
      pendingChatPrompt,
      setPendingChatPrompt,
      applyFocus,
    ],
  );

  return (
    <CompanyStockIntentContext.Provider value={value}>{children}</CompanyStockIntentContext.Provider>
  );
}

export function useCompanyStockIntent(): CompanyStockIntentApi {
  const ctx = useContext(CompanyStockIntentContext);
  if (!ctx) {
    throw new Error("useCompanyStockIntent doit être utilisé sous CompanyStockIntentProvider.");
  }
  return ctx;
}

export function useCompanyStockIntentOptional(): CompanyStockIntentApi | null {
  return useContext(CompanyStockIntentContext);
}
