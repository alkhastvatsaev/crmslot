"use client";

import { useMemo } from "react";
import { Receipt } from "lucide-react";
import { formatEur } from "@/features/billing/invoiceBillingPanelUtils";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  estimateInterventionBilling,
  type InterventionPriceEstimateInput,
} from "@/features/interventions/estimateInterventionBilling";

type Props = InterventionPriceEstimateInput & {
  className?: string;
};

export default function InterventionPriceEstimateCard({
  className,
  problemTemplateId,
  problem,
  problemLabel,
  title,
  transcription,
  category,
  address,
  urgency,
  scheduledDate,
  scheduledTime,
  requestedDate,
  requestedTime,
}: Props) {
  const { t } = useTranslation();

  const estimate = useMemo(
    () =>
      estimateInterventionBilling({
        problemTemplateId,
        problem,
        problemLabel,
        title,
        transcription,
        category,
        address,
        urgency,
        scheduledDate,
        scheduledTime,
        requestedDate,
        requestedTime,
      }),
    [
      problemTemplateId,
      problem,
      problemLabel,
      title,
      transcription,
      category,
      address,
      urgency,
      scheduledDate,
      scheduledTime,
      requestedDate,
      requestedTime,
    ]
  );

  if (!estimate) return null;

  const travelZoneKey = `requester.intervention.price_estimate_travel_zone_${estimate.travelZone}`;

  return (
    <div
      data-testid="intervention-price-estimate"
      className={
        className ??
        "rounded-[16px] border border-emerald-100 bg-emerald-50/70 px-3 py-2.5 text-slate-800"
      }
    >
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-800">
        <Receipt className="h-3.5 w-3.5" aria-hidden />
        {String(t("requester.intervention.price_estimate_title"))}
      </p>
      <ul className="space-y-0.5 text-[13px] leading-snug text-slate-700">
        {estimate.lines.map((line, idx) => (
          <li key={`${line.description}-${idx}`} className="flex justify-between gap-2">
            <span className="min-w-0 truncate">
              {line.description.toLowerCase().includes("déplacement") ||
              line.description.toLowerCase().includes("deplacement")
                ? String(t(travelZoneKey))
                : line.description}
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              {formatEur(Math.round(line.quantity * line.unitPriceCents))}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-baseline justify-between border-t border-emerald-100/80 pt-2">
        <span className="text-sm font-bold text-slate-900">
          {String(t("requester.intervention.price_estimate_total"))}
        </span>
        <span
          data-testid="intervention-price-estimate-total"
          className="text-lg font-extrabold tabular-nums text-slate-900"
        >
          {formatEur(estimate.totalCents)}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-slate-500">
        {String(t("requester.intervention.price_estimate_disclaimer"))}
      </p>
    </div>
  );
}
