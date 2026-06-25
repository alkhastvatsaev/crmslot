"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { buildCrmActivityEventDetail } from "@/features/crmHistory/crmActivityEventDetail";
import { crmHistoryEventLabel } from "@/features/crmHistory/crmHistoryEventLabel";
import type { CrmActivityEvent } from "@/features/crmHistory/crmActivityTypes";
import CrmHistoryQmSnapshotPanel from "@/features/crmHistory/components/CrmHistoryQmSnapshotPanel";
import {
  formatDateTime,
  formatSelectedDate,
} from "@/features/crmHistory/components/crmHistoryEventDetailFormat";

type Props = {
  event: CrmActivityEvent | null;
  onOpenIntervention?: (event: CrmActivityEvent) => void;
  allEvents?: CrmActivityEvent[];
  selectedDate?: Date;
};

export default function CrmHistoryEventDetailPanel({
  event,
  onOpenIntervention,
  allEvents = [],
  selectedDate,
}: Props) {
  const { t } = useTranslation();
  const dateLabel = selectedDate ? formatSelectedDate(selectedDate) : "cette période";

  if (!event) {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        data-testid="crm-history-detail-empty"
      >
        <CrmHistoryQmSnapshotPanel events={allEvents} dateLabel={dateLabel} />
      </div>
    );
  }

  const detail = buildCrmActivityEventDetail(event, (key) =>
    String(t(key as "crmHistory.detail.empty_title"))
  );
  const canOpenDossier = Boolean(event.interventionId && onOpenIntervention);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      data-testid="crm-history-detail-panel"
    >
      <header className="shrink-0 border-b border-black/5 px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {t("crmHistory.detail.heading")}
        </p>
        <h2
          className="mt-1 text-[18px] font-semibold leading-snug text-slate-900"
          data-testid="crm-history-detail-title"
        >
          {crmHistoryEventLabel(t, event.type)}
        </h2>
        <time
          className="mt-1 block text-[12px] text-slate-500"
          dateTime={new Date(event.ts).toISOString()}
          data-testid="crm-history-detail-time"
        >
          {formatDateTime(event.ts)}
        </time>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-3" data-testid="crm-history-detail-body">
          {detail.lines.map((line, index) => (
            <p
              key={`${event.id}-line-${index}`}
              className={cn(
                "text-[14px] leading-relaxed text-slate-700",
                index === 0 && "text-[15px] font-medium text-slate-800"
              )}
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      {canOpenDossier ? (
        <footer className="shrink-0 border-t border-black/5 px-5 py-3">
          <button
            type="button"
            data-testid="crm-history-detail-open-dossier"
            onClick={() => onOpenIntervention!(event)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            {t("crmHistory.detail.open_dossier")}
          </button>
        </footer>
      ) : null}
    </div>
  );
}
