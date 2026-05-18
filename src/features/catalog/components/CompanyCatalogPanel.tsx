"use client";

import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { createCatalogProduct } from "@/features/catalog/catalogFirestore";
import { useCompanyCatalog } from "@/features/catalog/useCompanyCatalog";

export default function CompanyCatalogPanel() {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("lecotProductSearch");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const isAdmin = workspace?.activeRole === "admin";
  const { products, loading } = useCompanyCatalog();

  const [sku, setSku] = useState("");
  const [label, setLabel] = useState("");
  const [priceEuros, setPriceEuros] = useState("");
  const [busy, setBusy] = useState(false);

  if (!enabled) {
    return (
      <p data-testid="company-catalog-disabled" className="text-sm text-slate-500">
        {t("catalog.company_disabled")}
      </p>
    );
  }

  if (!isAdmin) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !companyId) return;
    if (!sku.trim() || !label.trim()) {
      toast.error(String(t("catalog.company_fields_required")));
      return;
    }
    const euros = Number(priceEuros.replace(",", "."));
    if (!Number.isFinite(euros) || euros < 0) {
      toast.error(String(t("catalog.company_price_invalid")));
      return;
    }
    setBusy(true);
    try {
      await createCatalogProduct(firestore, companyId, {
        sku: sku.trim(),
        label: label.trim(),
        unitPriceCents: Math.round(euros * 100),
        supplier: "company",
        category: null,
        isActive: true,
      });
      setSku("");
      setLabel("");
      setPriceEuros("");
      toast.success(String(t("catalog.company_product_created")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      data-testid="company-catalog-panel"
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div>
        <h3 className="text-sm font-bold text-slate-900">{t("catalog.company_title")}</h3>
        <p className="text-xs text-slate-500">{t("catalog.company_subtitle")}</p>
      </div>

      <form onSubmit={(e) => void handleAdd(e)} data-testid="company-catalog-form" className="grid gap-2 sm:grid-cols-3">
        <input
          data-testid="company-catalog-sku"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder={String(t("catalog.company_sku"))}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        />
        <input
          data-testid="company-catalog-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={String(t("catalog.company_label"))}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm sm:col-span-1"
        />
        <input
          data-testid="company-catalog-price"
          value={priceEuros}
          onChange={(e) => setPriceEuros(e.target.value)}
          placeholder={String(t("catalog.company_price"))}
          inputMode="decimal"
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          data-testid="company-catalog-submit"
          className="flex items-center justify-center gap-1 rounded-lg bg-slate-900 py-2 text-sm font-bold text-white disabled:opacity-50 sm:col-span-3"
        >
          <Plus className="h-4 w-4" />
          {t("catalog.company_add")}
        </button>
      </form>

      <ul data-testid="company-catalog-list" className="max-h-40 space-y-1 overflow-y-auto">
        {loading ? (
          <li className="text-sm text-slate-400">{t("common.loading")}</li>
        ) : products.length === 0 ? (
          <li className="text-sm text-slate-500">{t("catalog.company_empty")}</li>
        ) : (
          products.map((p) => (
            <li
              key={p.id}
              data-testid={`company-catalog-row-${p.id}`}
              className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-sm"
            >
              <Package className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate font-medium">{p.label}</span>
              <span className="shrink-0 font-mono text-xs text-slate-500">{p.sku}</span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
