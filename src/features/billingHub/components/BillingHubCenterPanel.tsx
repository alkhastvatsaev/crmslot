"use client";

import { useEffect, useMemo } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useBillingHubIntent } from "@/context/BillingHubIntentContext";
import AccountingExportButton from "@/features/billing/components/AccountingExportButton";
import BillingHubFilterBar from "@/features/billingHub/components/BillingHubFilterBar";
import { applyBillingListFilters } from "@/features/billingHub/filterBillingHub";
import {
  computeBillingHubMetrics,
  formatEurFromCents,
  interventionBillingTotalCents,
  type BillingHubMetrics,
} from "@/features/billingHub/billingHubMetrics";
import type { Intervention } from "@/features/interventions/types";

const STATUS_CLASS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-800",
  unpaid: "bg-red-100 text-red-700",
  refunded: "bg-slate-100 text-slate-500",
};

type Props = {
  interventions: Intervention[];
  metrics: BillingHubMetrics;
  isPreviewCatalog: boolean;
  loading: boolean;
};

export default function BillingHubCenterPanel({
  interventions,
  metrics,
  isPreviewCatalog,
  loading,
}: Props) {
  const { t } = useTranslation();
  const {
    filter,
    setFilter,
    search,
    setSearch,
    selectedInterventionId,
    setSelectedInterventionId,
  } = useBillingHubIntent();

  const tableRows = useMemo(
    () => applyBillingListFilters(interventions, { filter, search }),
    [interventions, filter, search]
  );

  useEffect(() => {
    if (loading || tableRows.length === 0) return;
    const still = tableRows.some((iv) => iv.id === selectedInterventionId);
    if (!still) setSelectedInterventionId(tableRows[0].id);
  }, [loading, tableRows, selectedInterventionId, setSelectedInterventionId]);

  if (loading) {
    return (
      <div
        data-testid="billing-hub-center"
        className="flex min-h-0 flex-1 items-center justify-center"
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div
      data-testid="billing-hub-center"
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
    >
      <header className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
          {t("billingHub.title")}
        </h2>
        <AccountingExportButton interventions={interventions} />
      </header>

      {isPreviewCatalog ? (
        <span
          data-testid="billing-hub-preview-badge"
          className="shrink-0 self-start rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800"
        >
          {t("billingHub.preview_badge")}
        </span>
      ) : null}

      <div className="flex shrink-0 flex-wrap items-center gap-3 text-[11px] tabular-nums text-slate-600">
        <span data-testid="billing-hub-kpi-total">
          <strong className="text-slate-900">{formatEurFromCents(metrics.totalHtCents)}</strong> HT
        </span>
        <span data-testid="billing-hub-kpi-unpaid">
          {t("billingHub.kpi_unpaid_short")}{" "}
          <strong className="text-red-700">{formatEurFromCents(metrics.unpaidHtCents)}</strong>
        </span>
      </div>

      <BillingHubFilterBar metrics={metrics} activeFilter={filter} onFilterChange={setFilter} />

      <div className="relative shrink-0" data-testid="billing-hub-search">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={String(t("billingHub.search_placeholder"))}
          className="h-8 rounded-[12px] border-slate-200/80 bg-white pl-9 text-[12px]"
        />
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto rounded-[12px] border border-black/[0.06] bg-white">
        {tableRows.length === 0 ? (
          <p className="py-12 text-center text-[12px] text-slate-400">
            {t("billingHub.empty_filter")}
          </p>
        ) : (
          <table className="w-full text-[11px]" data-testid="billing-hub-table">
            <thead className="sticky top-0 bg-slate-50 text-[9px] uppercase tracking-wide text-slate-400">
              <tr className="border-b border-black/[0.06]">
                <th className="px-2 py-2 text-left font-semibold">{t("billingHub.col_client")}</th>
                <th className="hidden px-2 py-2 text-right font-semibold sm:table-cell">
                  {t("billingHub.col_amount")}
                </th>
                <th className="px-2 py-2 text-right font-semibold">{t("billingHub.col_status")}</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((iv) => {
                const active = iv.id === selectedInterventionId;
                const st = iv.paymentStatus ?? "unpaid";
                const cents = interventionBillingTotalCents(iv);
                return (
                  <tr
                    key={iv.id}
                    data-testid={`billing-hub-row-${iv.id}`}
                    onClick={() => setSelectedInterventionId(iv.id)}
                    className={cn(
                      "cursor-pointer border-b border-black/[0.03] hover:bg-slate-50/90",
                      active && "bg-slate-100",
                      st === "unpaid" && !active && "bg-red-50/30"
                    )}
                  >
                    <td className="px-2 py-2">
                      <span className="block truncate font-medium text-slate-800">
                        {iv.clientName || "—"}
                      </span>
                      <span className="block truncate text-[10px] text-slate-400">{iv.id}</span>
                    </td>
                    <td className="hidden px-2 py-2 text-right font-semibold tabular-nums sm:table-cell">
                      {cents > 0 ? formatEurFromCents(cents) : "—"}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <span
                        className={cn(
                          "inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                          STATUS_CLASS[st] ?? STATUS_CLASS.unpaid
                        )}
                      >
                        {t(
                          `billing.status_${st === "paid" ? "paid" : st === "pending" ? "pending" : st === "refunded" ? "refunded" : "unpaid"}`
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
