"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  isInterventionAwaitingTechnicianAcceptance,
  isInterventionPendingBackOfficeIntake,
} from "@/features/interventions/technicianSchedule";
import { capitalizeName } from "@/utils/stringUtils";
import type { Intervention } from "@/features/interventions";

type Props = {
  selectedItem: Intervention;
};

export default function InterventionDetailClientHeader({ selectedItem }: Props) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
            isInterventionAwaitingTechnicianAcceptance(selectedItem)
              ? "bg-slate-200 text-slate-700"
              : isInterventionPendingBackOfficeIntake(selectedItem)
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
          )}
        >
          {isInterventionAwaitingTechnicianAcceptance(selectedItem)
            ? t("backoffice.inbox.kind_awaiting")
            : isInterventionPendingBackOfficeIntake(selectedItem)
              ? t("backoffice.inbox.kind_request")
              : t("backoffice.inbox.kind_report")}{" "}
          • ID: {selectedItem.id.slice(-6).toUpperCase()}
        </span>
      </div>
      <h2 className="text-2xl font-black text-slate-900 leading-tight">
        {capitalizeName(
          selectedItem.clientLastName ||
            selectedItem.clientName ||
            t("backoffice.inbox.anonymous_client")
        )}
      </h2>
      <p className="text-[15px] font-medium text-slate-500 mt-1">
        {selectedItem.clientPhone || t("backoffice.inbox.no_phone")}
      </p>
      {selectedItem.clientEmail && (
        <p className="text-[14px] font-medium text-slate-500 mt-0.5 break-all">
          <a href={`mailto:${selectedItem.clientEmail}`} className="hover:underline">
            {selectedItem.clientEmail}
          </a>
        </p>
      )}
    </div>
  );
}
