"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { BillingHubMetrics, BillingPaymentFilter } from "@/features/billingHub/billingHubMetrics";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

const FILTERS: { id: BillingPaymentFilter; labelKey: string; countKey: keyof BillingHubMetrics }[] = [
  { id: "all", labelKey: "billingHub.filter_all", countKey: "total" },
  { id: "unpaid", labelKey: "billingHub.filter_unpaid", countKey: "unpaid" },
  { id: "pending", labelKey: "billingHub.filter_pending", countKey: "pending" },
  { id: "paid", labelKey: "billingHub.filter_paid", countKey: "paid" },
  { id: "to_bill", labelKey: "billingHub.filter_to_bill", countKey: "toBill" },
];

type Props = {
  metrics: BillingHubMetrics;
  activeFilter: BillingPaymentFilter;
  onFilterChange: (f: BillingPaymentFilter) => void;
};

export default function BillingHubFilterBar({ metrics, activeFilter, onFilterChange }: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="billing-hub-filter-bar"
      className="flex shrink-0 flex-wrap gap-1.5"
      style={outfit}
      role="tablist"
    >
      {FILTERS.map((f) => {
        const count = metrics[f.countKey] as number;
        const active = activeFilter === f.id;
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={`billing-hub-filter-${f.id}`}
            onClick={() => onFilterChange(f.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition",
              active ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-black/[0.08] hover:bg-slate-50",
            )}
          >
            <span>{t(f.labelKey)}</span>
            <span
              className={cn(
                "min-w-[1.25rem] rounded-full px-1 text-center text-[10px] font-bold tabular-nums",
                active ? "bg-white/20" : "bg-slate-100",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
