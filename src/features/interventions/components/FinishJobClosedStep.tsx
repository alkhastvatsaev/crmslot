"use client";

import { CheckCircle2 } from "lucide-react";
import { HubButton } from "@/core/ui/hub";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  onDone: () => void;
};

export default function FinishJobClosedStep({ onDone }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex max-w-sm flex-col items-center rounded-2xl border border-emerald-100 bg-emerald-50/50 px-6 py-10 text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="text-[17px] font-bold text-slate-900">
        {String(t("technician_hub.finish.closure_complete_title"))}
      </h2>
      <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-600">
        {String(t("technician_hub.finish.closure_complete_desc"))}
      </p>
      <HubButton
        type="button"
        data-testid="finish-job-closure-done"
        onClick={onDone}
        className="mt-6"
      >
        {String(t("technician_hub.finish.closure_complete_cta"))}
      </HubButton>
    </div>
  );
}
