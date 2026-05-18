"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { CatalogProduct } from "@/features/catalog/productQuickAdd";
import { LECOT_CATALOG } from "@/features/catalog/lecotCatalog";
import { mergeCatalogProducts, searchCatalogProducts } from "@/features/catalog/searchCatalogProducts";
import { STUB_CATALOG } from "@/features/catalog/productQuickAdd";

const OFFLINE_CATALOG = mergeCatalogProducts(LECOT_CATALOG, STUB_CATALOG);
const MIN_QUERY = 2;
const DEBOUNCE_MS = 300;

type SearchState = {
  products: CatalogProduct[];
  loading: boolean;
  error: boolean;
};

type Options = {
  category?: string;
  companyId?: string;
};

export function useLecotProductSearch(
  query: string,
  enabled: boolean,
  options?: Options,
): SearchState {
  const [state, setState] = useState<SearchState>({
    products: [],
    loading: false,
    error: false,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ products: [], loading: false, error: false });
      return;
    }

    const q = query.trim();
    if (q.length < MIN_QUERY) {
      setState({ products: [], loading: false, error: false });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: false }));

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const params = new URLSearchParams({ q });
          if (options?.category?.trim()) {
            params.set("category", options.category.trim());
          }
          if (options?.companyId?.trim()) {
            params.set("companyId", options.companyId.trim());
          }
          const res = await fetchWithAuth(`/api/catalog/lecot-search?${params}`);
          if (!res.ok) throw new Error("search failed");
          const data = (await res.json()) as { products?: CatalogProduct[] };
          if (cancelled) return;
          setState({
            products: Array.isArray(data.products) ? data.products : [],
            loading: false,
            error: false,
          });
        } catch {
          if (cancelled) return;
          setState({
            products: searchCatalogProducts(OFFLINE_CATALOG, q, 12),
            loading: false,
            error: true,
          });
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, enabled, options?.category, options?.companyId]);

  return state;
}
