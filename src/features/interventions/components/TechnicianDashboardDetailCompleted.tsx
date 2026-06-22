"use client";

import { CheckCircle2, Pencil } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";

export default function TechnicianDashboardDetailCompleted({
  isInvoicedAmendable,
  onStartFinishJob,
}: {
  isInvoicedAmendable: boolean;
  onStartFinishJob: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center rounded-xl border border-emerald-100/80 bg-emerald-50/40 px-6 py-8">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <p className="text-center text-[13px] font-bold text-slate-900">
          {t("technician_hub.dashboard.detail.mission_completed")}
        </p>
      </div>
      {isInvoicedAmendable ? (
        <button
          type="button"
          data-testid="technician-edit-closed-intervention"
          aria-label={String(t("technician_hub.dashboard.detail.consult_edit_closed"))}
          onClick={onStartFinishJob}
          className="mt-5 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
        >
          <Pencil className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
