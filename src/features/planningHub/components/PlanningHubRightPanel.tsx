"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions";
import type { PlanningPendingRow } from "@/features/planningHub/planningHubTypes";
import PlanningHubInterventionDetail from "@/features/planningHub/components/PlanningHubInterventionDetail";

type Props = {
  selectedIntervention: Intervention | null;
  pendingRows: PlanningPendingRow[];
};

export default function PlanningHubRightPanel({ selectedIntervention, pendingRows }: Props) {
  const { t } = useTranslation();

  if (selectedIntervention) {
    return <PlanningHubInterventionDetail intervention={selectedIntervention} />;
  }

  return (
    <div
      data-testid="planning-hub-confirmations"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {pendingRows.length === 0 ? (
        <div data-testid="planning-hub-pending-empty" className="min-h-0 flex-1" aria-hidden />
      ) : (
        <ul className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {pendingRows.map((row) => (
            <li
              key={row.id}
              data-testid={`planning-confirm-${row.id}`}
              className="rounded-[18px] border border-black/[0.05] bg-white/95 p-3"
            >
              <p className="text-[13px] font-semibold text-slate-800">{row.clientLabel}</p>
              <p className="text-[12px] text-slate-600">{row.slotLabel}</p>
              <span
                className={cn(
                  "mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                  row.state === "unassigned"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-sky-100 text-sky-800"
                )}
              >
                {t(`planningHub.pending_state.${row.state}`)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
