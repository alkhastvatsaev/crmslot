"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useBillingHubIntent } from "@/context/BillingHubIntentContext";
import { sortBillingRows } from "@/features/billingHub/filterBillingHub";
import { interventionBillingTotalCents, formatEurFromCents } from "@/features/billingHub/billingHubMetrics";
import type { BillingHubMetrics, BillingPaymentFilter } from "@/features/billingHub/billingHubMetrics";
import type { Intervention } from "@/features/interventions/types";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

type Props = {
  interventions: Intervention[];
  metrics: BillingHubMetrics;
  loading: boolean;
};

export default function BillingHubLeftRail({ interventions, metrics, loading }: Props) {
  const { t } = useTranslation();
  const { filter, setFilter, selectedInterventionId, setSelectedInterventionId } = useBillingHubIntent();

  const urgent = useMemo(
    () =>
      sortBillingRows(
        interventions.filter(
          (iv) =>
            (iv.paymentStatus === "unpaid" || !iv.paymentStatus) &&
            interventionBillingTotalCents(iv) > 0,
        ),
      ).slice(0, 6),
    [interventions],
  );

  const shortcuts: { filter: BillingPaymentFilter; labelKey: string; count: number }[] = [
    { filter: "unpaid", labelKey: "billingHub.filter_unpaid", count: metrics.unpaid },
    { filter: "to_bill", labelKey: "billingHub.filter_to_bill", count: metrics.toBill },
  ];

  return (
    <div
      data-testid="billing-hub-left-rail"
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
      style={outfit}
    >
      <div className="flex flex-col gap-1">
        {shortcuts.map((s) => (
          <button
            key={s.filter}
            type="button"
            data-testid={`billing-hub-quick-${s.filter}`}
            onClick={() => setFilter(s.filter)}
            className={cn(
              "flex items-center justify-between rounded-[10px] px-2 py-1.5 text-[11px]",
              filter === s.filter ? "bg-slate-900 text-white" : "bg-white/80 text-slate-600 ring-1 ring-black/[0.05]",
            )}
          >
            <span>{t(s.labelKey)}</span>
            <span className="font-bold tabular-nums">{s.count}</span>
          </button>
        ))}
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <Loader2 className="mx-auto h-4 w-4 animate-spin text-slate-300" />
        ) : urgent.length === 0 ? null : (
          <ul className="space-y-0.5" data-testid="billing-hub-urgent-list">
            {urgent.map((iv) => (
              <li key={iv.id}>
                <button
                  type="button"
                  data-testid={`billing-hub-jump-${iv.id}`}
                  onClick={() => setSelectedInterventionId(iv.id)}
                  className={cn(
                    "w-full truncate rounded-[8px] px-1.5 py-1 text-left text-[11px]",
                    selectedInterventionId === iv.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-white/80",
                  )}
                >
                  {iv.clientName} · {formatEurFromCents(interventionBillingTotalCents(iv))}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
