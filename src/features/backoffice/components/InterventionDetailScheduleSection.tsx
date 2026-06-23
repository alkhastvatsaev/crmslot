"use client";

import { Clock } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions";

type Props = {
  selectedItem: Intervention;
};

export default function InterventionDetailScheduleSection({ selectedItem }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          {t("backoffice.inbox.requested_schedule")}
        </span>
      </div>

      <div className="flex items-center gap-2 text-blue-900 font-bold">
        <Clock className="w-4 h-4" />
        {selectedItem.requestedDate
          ? `${selectedItem.requestedDate} ${selectedItem.requestedTime ? `à ${selectedItem.requestedTime}` : ""}`
          : t("backoffice.inbox.asap")}
      </div>
    </div>
  );
}
