"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { statusLabelKey } from "@/features/interventions/technicianSchedule";
import { CRM_HISTORY_EVENT_META } from "@/features/crmHistory/crmHistoryEventMeta";
import { formatCrmFeedTime } from "@/features/crmHistory/crmHistoryFeedFormat";
import type { CrmActivityEvent } from "@/features/crmHistory/crmActivityTypes";
import type { Intervention } from "@/features/interventions";

type Props = {
  event: CrmActivityEvent;
  onSelect?: (e: CrmActivityEvent) => void;
  isNew?: boolean;
  isSelected?: boolean;
};

/** Variante liste horizontale — conservée pour réutilisation future. */
export default function CrmHistoryEventRow({ event, onSelect, isNew, isSelected }: Props) {
  const { t } = useTranslation();
  const meta = CRM_HISTORY_EVENT_META[event.type];
  const { Icon, colorClass, dotClass } = meta;
  const isClickable = Boolean(onSelect);

  const subtitle =
    event.emailSubject ?? event.clientName ?? event.address ?? event.orderLabel ?? null;

  const statusLabel = (code: string | undefined) => {
    if (!code) return null;
    if (event.type === "quote_status_changed") {
      return String(t(`quotes.status.${code}`)) || code;
    }
    const key = statusLabelKey(code as Intervention["status"]);
    return String(t(key));
  };

  const statusBadge =
    event.statusBefore || event.statusAfter ? (
      <span className="ml-1 inline-flex flex-wrap items-center gap-1 text-[10px] font-semibold text-amber-800">
        {event.statusBefore ? (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 border border-slate-200">
            {statusLabel(event.statusBefore)}
          </span>
        ) : null}
        {event.statusBefore && event.statusAfter ? (
          <ArrowRight className="h-3 w-3 text-slate-400" aria-hidden />
        ) : null}
        {event.statusAfter ? (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 border border-amber-200">
            {statusLabel(event.statusAfter)}
          </span>
        ) : null}
      </span>
    ) : null;

  const actorLabel = event.actorRole
    ? String(t(`crmHistory.actor.${event.actorRole}` as "crmHistory.actor.dispatcher"))
    : null;

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
        "group relative flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/80 crm-animate-item",
        isClickable && "cursor-pointer hover:shadow-sm",
        isNew && "crm-event-row--new bg-blue-50/90 ring-1 ring-blue-200/80 shadow-sm",
        isSelected && "bg-white ring-2 ring-blue-400/70 shadow-sm"
      )}
    >
      <div className="relative flex flex-col items-center pt-1">
        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotClass}`} />
      </div>

      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/70 shadow-sm ${colorClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[13px] font-semibold text-slate-800 leading-tight">
            {t(`crmHistory.event.${event.type}`)}
          </span>
          {statusBadge}
          {event.interventionTitle && (
            <span className="text-[12px] text-slate-500 truncate">— {event.interventionTitle}</span>
          )}
        </div>
        {subtitle && <span className="mt-0.5 text-[11px] text-slate-400 truncate">{subtitle}</span>}
        {actorLabel ? (
          <span className="mt-0.5 text-[10px] text-slate-500">
            {actorLabel}
            {event.note ? ` · ${event.note}` : null}
          </span>
        ) : event.note ? (
          <span className="mt-0.5 text-[10px] text-slate-500">{event.note}</span>
        ) : null}
        {event.orderTotalCents != null && (
          <span className="mt-0.5 text-[11px] font-medium text-teal-600">
            {(event.orderTotalCents / 100).toFixed(2)} €
          </span>
        )}
        {event.commissionAmountEuros != null && (
          <span className="mt-0.5 text-[11px] font-medium text-yellow-600">
            {event.commissionAmountEuros.toFixed(2)} €
            {event.commissionAction ? ` — ${event.commissionAction}` : ""}
          </span>
        )}
        {(event.type === "email_sent" || event.type === "email_received") && event.emailFrom && (
          <span className="mt-0.5 text-[11px] text-slate-400 truncate">
            {event.type === "email_sent" ? `→ ${event.emailTo}` : `← ${event.emailFrom}`}
          </span>
        )}
      </div>

      <span className="flex-shrink-0 text-[11px] text-slate-400 pt-0.5">
        {formatCrmFeedTime(event.ts)}
      </span>
    </div>
  );
}
