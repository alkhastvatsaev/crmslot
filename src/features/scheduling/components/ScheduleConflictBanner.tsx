"use client";

import { AlertTriangle } from "lucide-react";
import type { ScheduleConflict } from "@/features/scheduling/scheduleConflicts";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  conflicts: ScheduleConflict[];
  className?: string;
};

export default function ScheduleConflictBanner({ conflicts, className }: Props) {
  const { t } = useTranslation();
  if (conflicts.length === 0) return null;

  return (
    <div
      data-testid="schedule-conflict-banner"
      className={className}
      role="alert"
    >
      <div className="flex gap-3 rounded-[16px] border border-amber-200 bg-amber-50/95 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-amber-950">{t("scheduling.conflict.title")}</p>
          <ul className="mt-2 space-y-1">
            {conflicts.map((c) => (
              <li
                key={c.interventionId}
                data-testid={`schedule-conflict-${c.interventionId}`}
                className="text-[12px] text-amber-900"
              >
                {c.clientLabel} · {c.scheduledDate} {c.scheduledTime}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
