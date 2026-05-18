"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import type { Intervention } from "@/features/interventions/types";
import {
  STUB_CATALOG,
  catalogLineFromProduct,
  filterCatalogForIntervention,
} from "@/features/catalog/productQuickAdd";
import type { BillingLine } from "@/features/interventions/components/TechnicianBillingLinesForm";

type Props = {
  intervention: Pick<Intervention, "category" | "problem">;
  onAddLine: (line: BillingLine) => void;
};

export default function ProductQuickAddBar({ intervention, onAddLine }: Props) {
  const enabled = useFeatureFlag("lecotProductSearch");
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const products = useMemo(
    () => filterCatalogForIntervention(STUB_CATALOG, intervention),
    [intervention],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 6);
    return products.filter(
      (p) =>
        p.label.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [products, query]);

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
          placeholder={t("catalog.search_placeholder")}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm"
        />
      </div>
      <ul className="flex max-h-36 flex-col gap-1 overflow-y-auto">
        {filtered.map((p) => (
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
        ))}
      </ul>
    </section>
  );
}
