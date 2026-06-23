"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { BillingPaymentFilter } from "@/features/billingHub";

type BillingHubIntentApi = {
  filter: BillingPaymentFilter;
  setFilter: (f: BillingPaymentFilter) => void;
  search: string;
  setSearch: (q: string) => void;
  selectedInterventionId: string | null;
  setSelectedInterventionId: (id: string | null) => void;
};

const BillingHubIntentContext = createContext<BillingHubIntentApi | null>(null);

export function BillingHubIntentProvider({ children }: { children: ReactNode }) {
  const [filter, setFilterState] = useState<BillingPaymentFilter>("all");
  const [search, setSearchState] = useState("");
  const [selectedInterventionId, setSelectedInterventionIdState] = useState<string | null>(null);

  const setFilter = useCallback((f: BillingPaymentFilter) => setFilterState(f), []);
  const setSearch = useCallback((q: string) => setSearchState(q), []);
  const setSelectedInterventionId = useCallback((id: string | null) => {
    setSelectedInterventionIdState(id?.trim() ? id.trim() : null);
  }, []);

  const value = useMemo(
    () => ({
      filter,
      setFilter,
      search,
      setSearch,
      selectedInterventionId,
      setSelectedInterventionId,
    }),
    [filter, setFilter, search, setSearch, selectedInterventionId, setSelectedInterventionId]
  );

  return (
    <BillingHubIntentContext.Provider value={value}>{children}</BillingHubIntentContext.Provider>
  );
}

export function useBillingHubIntent(): BillingHubIntentApi {
  const ctx = useContext(BillingHubIntentContext);
  if (!ctx) {
    throw new Error("useBillingHubIntent doit être utilisé sous BillingHubIntentProvider.");
  }
  return ctx;
}

export function useBillingHubIntentOptional(): BillingHubIntentApi | null {
  return useContext(BillingHubIntentContext);
}
