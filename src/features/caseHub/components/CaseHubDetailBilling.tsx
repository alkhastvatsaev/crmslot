"use client";

import { useMemo } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import InterventionInvoicePreviewCard from "@/features/billing/components/InterventionInvoicePreviewCard";
import { invoicePreviewFromIntervention } from "@/features/billing/invoicePreviewFromIntervention";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  intervention: Intervention;
};

export default function CaseHubDetailBilling({ intervention }: Props) {
  const { t } = useTranslation();
  const preview = useMemo(() => invoicePreviewFromIntervention(intervention), [intervention]);
  const hasPreview =
    (preview.billingLines?.length ?? 0) > 0 || Boolean(preview.invoicePdfUrl?.trim());

  if (!hasPreview) return null;

  return (
    <div
      data-testid="case-hub-detail-billing"
      className="flex shrink-0 flex-col gap-2 border-b border-black/[0.05] px-4 py-3"
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {t("caseHub.right.billing_preview")}
      </p>
      <InterventionInvoicePreviewCard {...preview} />
    </div>
  );
}
