"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, Loader2, Package } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useLecotProductSearch } from "@/features/catalog/useLecotProductSearch";
import { LECOT_CATALOG } from "@/features/catalog/lecotCatalog";
import { searchCatalogProducts } from "@/features/catalog/searchCatalogProducts";

export interface LecotProduct {
  ref: string;
  name: string;
  price?: number;
}

interface OmniSearchLecotProps {
  onSelectProduct: (product: LecotProduct) => void;
  placeholder?: string;
}

function toLecotProduct(p: { sku: string; label: string; unitPriceCents: number }): LecotProduct {
  return {
    ref: p.sku,
    name: p.label,
    price: p.unitPriceCents / 100,
  };
}

/**
 * OmniSearchLecot — recherche catalogue matériel (API Lecot ou fallback local).
 */
export default function OmniSearchLecot({ onSelectProduct, placeholder }: OmniSearchLecotProps) {
  const { t } = useTranslation();
  const lecotEnabled = useFeatureFlag("lecotProductSearch");
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { products: remoteProducts, loading, error } = useLecotProductSearch(query, lecotEnabled);

  const results: LecotProduct[] =
    query.trim().length >= 2
      ? remoteProducts.map(toLecotProduct)
      : searchCatalogProducts(LECOT_CATALOG, query, 6).map(toLecotProduct);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setIsOpen(false);
      return;
    }
    if (!loading) setIsOpen(true);
  }, [query, loading, results.length]);

  const handleSelect = (product: LecotProduct) => {
    onSelectProduct(product);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full" data-testid="omni-search-lecot">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-5 w-5 text-slate-400" />
        <input
          type="text"
          data-testid="omni-search-lecot-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || String(t("materials.form.search_lecot_placeholder"))}
          className="h-12 w-full rounded-xl border-2 border-blue-100 bg-blue-50/30 pl-10 pr-4 font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
        />
        {loading ? (
          <Loader2
            data-testid="omni-search-lecot-loading"
            className="absolute right-3 h-5 w-5 animate-spin text-blue-500"
          />
        ) : null}
      </div>

      {error ? (
        <p data-testid="omni-search-lecot-error" className="mt-1 text-xs text-amber-700">
          {t("catalog.search_error")}
        </p>
      ) : null}

      {isOpen && results.length > 0 ? (
        <div
          data-testid="omni-search-lecot-results"
          className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-xl"
        >
          {results.map((product) => (
            <button
              key={product.ref}
              type="button"
              data-testid={`omni-search-lecot-${product.ref}`}
              onClick={() => handleSelect(product)}
              className="flex w-full items-center gap-3 border-b border-slate-50 p-3 text-left transition-colors last:border-0 hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold text-slate-800">{product.name}</div>
                <div className="mt-0.5 font-mono text-[12px] text-slate-500">{product.ref}</div>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {isOpen && results.length === 0 && !loading && query.trim().length >= 2 ? (
        <div
          data-testid="omni-search-lecot-empty"
          className="absolute z-50 mt-2 w-full rounded-xl border border-slate-100 bg-white p-4 text-center shadow-xl"
        >
          <p className="text-[14px] font-medium text-slate-500">{t("catalog.no_results")}</p>
        </div>
      ) : null}
    </div>
  );
}
