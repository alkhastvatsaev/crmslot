"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { buildCrmActivityEventDetail } from "@/features/crmHistory/crmActivityEventDetail";
import { CRM_HISTORY_EVENT_META } from "@/features/crmHistory/crmHistoryEventMeta";
import { crmHistoryEventLabel } from "@/features/crmHistory/crmHistoryEventLabel";
import { formatCrmFeedDateTime } from "@/features/crmHistory/crmHistoryFeedFormat";
import type { CrmActivityEvent } from "@/features/crmHistory/crmActivityTypes";

type Props = {
  event: CrmActivityEvent;
  onBack: () => void;
  onOpenIntervention?: (e: CrmActivityEvent) => void;
};

export default function CrmHistoryEventDetailInline({ event, onBack, onOpenIntervention }: Props) {
  const { t } = useTranslation();
  const meta = CRM_HISTORY_EVENT_META[event.type];
  const { Icon, colorClass } = meta;
  const detail = buildCrmActivityEventDetail(event, (key) =>
    String(t(key as "crmHistory.detail.empty_title"))
  );
  const canOpenDossier = Boolean(event.interventionId && onOpenIntervention);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      data-testid="crm-history-detail-panel"
    >
      <div className="shrink-0 flex items-center gap-3 border-b border-black/5 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
          aria-label="Retour à la liste"
        >
          <ArrowLeft className="h-4 w-4 text-slate-500" />
        </button>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm ${colorClass}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] font-semibold text-slate-800 leading-tight truncate">
            {crmHistoryEventLabel(t, event.type)}
          </span>
          <time className="text-[11px] text-slate-400">{formatCrmFeedDateTime(event.ts)}</time>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-3" data-testid="crm-history-detail-body">
          {detail.lines.map((line, i) => (
            <p
              key={i}
              className={cn(
                "text-[14px] leading-relaxed text-slate-700",
                i === 0 && "text-[15px] font-medium text-slate-800"
              )}
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      {canOpenDossier && (
        <div className="shrink-0 border-t border-black/5 px-5 py-3">
          <button
            type="button"
            onClick={() => onOpenIntervention!(event)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            {t("crmHistory.detail.open_dossier")}
          </button>
        </div>
      )}
    </div>
  );
}
