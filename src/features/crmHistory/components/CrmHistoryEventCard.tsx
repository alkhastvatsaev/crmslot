"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { getCrmHistoryEventMeta } from "@/features/crmHistory/crmHistoryEventMeta";
import { crmHistoryEventLabel } from "@/features/crmHistory/crmHistoryEventLabel";
import { formatCrmFeedTime } from "@/features/crmHistory/crmHistoryFeedFormat";
import type { CrmActivityEvent } from "@/features/crmHistory/crmActivityTypes";

type Props = {
  event: CrmActivityEvent;
  onSelect?: (e: CrmActivityEvent) => void;
  isNew?: boolean;
  isSelected?: boolean;
  index: number;
};

export default function CrmHistoryEventCard({ event, onSelect, isNew, isSelected, index }: Props) {
  const { t } = useTranslation();
  const meta = getCrmHistoryEventMeta(event.type);
  const { Icon, colorClass, dotClass } = meta;
  const isClickable = Boolean(onSelect);

  const subtitle =
    event.clientName ??
    event.address ??
    event.interventionTitle ??
    event.orderLabel ??
    event.emailSubject ??
    null;

  return (
    <div
      data-testid={`crm-event-${event.id}`}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onSelect!(event) : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onSelect!(event);
            }
          : undefined
      }
      className={cn(
        "crm-animate-item relative aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-black/5 bg-white/70 px-2 pb-3 pt-2 text-center shadow-sm transition-all overflow-hidden",
        isClickable && "cursor-pointer hover:shadow-md hover:border-black/10",
        isNew && "ring-2 ring-blue-300/70 bg-blue-50/80",
        isSelected && "ring-2 ring-blue-500/60 bg-white shadow-md"
      )}
    >
      <span className="absolute top-2 left-2.5 text-[9px] font-bold tabular-nums text-slate-300">
        {index + 1}
      </span>
      {isNew && <span className={`absolute top-2 right-2 h-1.5 w-1.5 rounded-full ${dotClass}`} />}

      <span className="text-[11px] font-semibold tabular-nums text-slate-500 leading-none">
        {formatCrmFeedTime(event.ts)}
      </span>

      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm ${colorClass}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="flex flex-col gap-0.5 w-full">
        <span className="text-[10px] font-semibold leading-tight text-slate-700 line-clamp-2">
          {crmHistoryEventLabel(t, event.type)}
        </span>
        {subtitle && <span className="text-[9px] text-slate-400 truncate">{subtitle}</span>}
      </div>
    </div>
  );
}
