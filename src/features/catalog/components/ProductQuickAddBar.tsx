"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import type { Intervention } from "@/features/interventions";
import {
  STUB_CATALOG,
  catalogLineFromProduct,
  filterCatalogForIntervention,
} from "@/features/catalog/productQuickAdd";
import { LECOT_CATALOG } from "@/features/catalog/lecotCatalog";
import { mergeCatalogProducts } from "@/features/catalog/searchCatalogProducts";
import { useLecotProductSearch } from "@/features/catalog/useLecotProductSearch";
import type { BillingLine } from "@/features/interventions";

type Props = {
  intervention: Pick<Intervention, "category" | "problem">;
  onAddLine: (line: BillingLine) => void;
};

const LOCAL_CATALOG = mergeCatalogProducts(LECOT_CATALOG, STUB_CATALOG);

export default function ProductQuickAddBar({ intervention, onAddLine }: Props) {
  const enabled = useFeatureFlag("lecotProductSearch");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const category = intervention.category?.trim() || undefined;
  const {
    products: remoteProducts,
    loading,
    error,
  } = useLecotProductSearch(query, enabled, { category, companyId: companyId || undefined });

  const localProducts = useMemo(
    () => filterCatalogForIntervention(LOCAL_CATALOG, intervention),
    [intervention]
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    if (q.length >= 2) return remoteProducts;
    return localProducts.slice(0, 6);
  }, [query, remoteProducts, localProducts]);

  if (!enabled) return null;

  return (
    <section
      data-testid="product-quick-add-bar"
      className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3"
    >
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          data-testid="product-quick-add-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={String(t("catalog.search_placeholder"))}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm"
        />
        {loading ? (
          <Loader2
            data-testid="product-quick-add-loading"
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-500"
          />
        ) : null}
      </div>

      {error ? (
        <p data-testid="product-quick-add-error" className="mb-2 text-xs text-amber-700">
          {t("catalog.search_error")}
        </p>
      ) : null}

      <ul
        className="flex max-h-36 flex-col gap-1 overflow-y-auto"
        data-testid="product-quick-add-results"
      >
        {filtered.length === 0 && query.trim().length >= 2 && !loading ? (
          <li
            data-testid="product-quick-add-empty"
            className="px-2 py-2 text-center text-sm text-slate-500"
          >
            {t("catalog.no_results")}
          </li>
        ) : (
          filtered.map((p) => (
            <li key={p.sku}>
              <button
                type="button"
                data-testid={`product-quick-add-${p.sku}`}
                onClick={() => onAddLine(catalogLineFromProduct(p))}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white"
              >
                <span className="font-medium text-slate-800">{p.label}</span>
                <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-blue-600">
                  <Plus className="h-3 w-3" />
                  {t("catalog.add_line")}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
