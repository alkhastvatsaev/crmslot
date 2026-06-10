"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useBillingHubIntent } from "@/context/BillingHubIntentContext";
import { applyBillingListFilters } from "@/features/billingHub/filterBillingHub";
import {
  formatEurFromCents,
  interventionBillingTotalCents,
} from "@/features/billingHub/billingHubMetrics";
import { useActivityLog } from "@/features/crmHistory/useActivityLog";
import type { Intervention } from "@/features/interventions/types";

const BILLING_GRID_MIN_SLOTS = 9;

const STATUS_CLASS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-800",
  unpaid: "bg-red-100 text-red-700",
  refunded: "bg-slate-100 text-slate-500",
};

const TILE_RING: Record<string, string> = {
  paid: "ring-emerald-200/80",
  pending: "ring-amber-200/80",
  unpaid: "ring-red-200/70",
  refunded: "ring-slate-200/80",
};

function BillingHubEmptySlot({ index }: { index: number }) {
  return (
    <div
      data-testid={`billing-hub-empty-slot-${index}`}
      aria-hidden
      className="aspect-square w-full justify-self-center rounded-[24px] border border-black/[0.06] bg-white/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]"
    />
  );
}

type Props = {
  interventions: Intervention[];
  isPreviewCatalog: boolean;
  loading: boolean;
};

export default function BillingHubCenterPanel({ interventions, isPreviewCatalog, loading }: Props) {
  const { t } = useTranslation();
  const { filter, search, selectedInterventionId, setSelectedInterventionId } =
    useBillingHubIntent();
  const { logIntervention } = useActivityLog();

  const handleTileClick = useCallback(
    (iv: Intervention) => {
      setSelectedInterventionId(iv.id);
      logIntervention(iv);
    },
    [setSelectedInterventionId, logIntervention]
  );

  const gridRows = useMemo(
    () => applyBillingListFilters(interventions, { filter, search }),
    [interventions, filter, search]
  );

  const trailingEmptySlots = useMemo(() => {
    if (gridRows.length === 0) return BILLING_GRID_MIN_SLOTS;
    if (gridRows.length >= BILLING_GRID_MIN_SLOTS) return 0;
    return BILLING_GRID_MIN_SLOTS - gridRows.length;
  }, [gridRows.length]);

  useEffect(() => {
    if (loading || gridRows.length === 0) return;
    const still = gridRows.some((iv) => iv.id === selectedInterventionId);
    if (!still) setSelectedInterventionId(gridRows[0].id);
  }, [loading, gridRows, selectedInterventionId, setSelectedInterventionId]);

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
    <div data-testid="billing-hub-center" className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {isPreviewCatalog ? (
        <span data-testid="billing-hub-preview-badge" className="sr-only" aria-hidden>
          {t("billingHub.preview_badge")}
        </span>
      ) : null}

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div
          className="grid grid-cols-3 gap-3 px-3 pb-6 pt-4 content-start [grid-template-columns:repeat(3,minmax(0,1fr))]"
          data-testid={gridRows.length === 0 ? "billing-hub-empty-grid" : "billing-hub-grid"}
        >
          {gridRows.map((iv) => {
            const active = iv.id === selectedInterventionId;
            const st = iv.paymentStatus ?? "unpaid";
            const cents = interventionBillingTotalCents(iv);

            return (
              <button
                key={iv.id}
                type="button"
                data-testid={`billing-hub-row-${iv.id}`}
                onClick={() => handleTileClick(iv)}
                className={cn(
                  "flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-[24px] border bg-white/95 p-3 text-center shadow-[0_6px_18px_-4px_rgba(15,23,42,0.1)] transition hover:scale-[1.02] active:scale-[0.96]",
                  active
                    ? "border-slate-900 ring-2 ring-slate-900/20"
                    : cn("border-black/[0.06] ring-1", TILE_RING[st] ?? TILE_RING.unpaid)
                )}
              >
                <span className="line-clamp-2 text-[13px] font-bold leading-tight tracking-[-0.02em] text-slate-900">
                  {iv.clientName || "—"}
                </span>
                <span className="text-[15px] font-semibold tabular-nums text-slate-800">
                  {cents > 0 ? formatEurFromCents(cents) : "—"}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                    STATUS_CLASS[st] ?? STATUS_CLASS.unpaid
                  )}
                >
                  {t(
                    `billing.status_${st === "paid" ? "paid" : st === "pending" ? "pending" : st === "refunded" ? "refunded" : "unpaid"}`
                  )}
                </span>
              </button>
            );
          })}
          {trailingEmptySlots > 0
            ? Array.from({ length: trailingEmptySlots }, (_, i) => (
                <BillingHubEmptySlot
                  key={`empty-${gridRows.length + i}`}
                  index={gridRows.length + i}
                />
              ))
            : null}
        </div>
      </div>
    </div>
  );
}
