"use client";

import {
  FilePlus,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  FileText,
  Package,
  Truck,
  Loader2,
  Inbox,
  ClipboardList,
  Mail,
  MailOpen,
  Coins,
  UserX,
  RotateCcw,
  Trash2,
  FileCheck,
  MessageCircle,
  CalendarClock,
  CreditCard,
  Ban,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { statusLabelKey } from "@/features/interventions/technicianSchedule";
import type { CrmActivityEvent, CrmEventType } from "../crmActivityTypes";
import type { Intervention } from "@/features/interventions/types";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

const EVENT_META: Record<
  CrmEventType,
  { Icon: React.FC<{ className?: string }>; colorClass: string; dotClass: string }
> = {
  intervention_created: {
    Icon: FilePlus,
    colorClass: "text-blue-600",
    dotClass: "bg-blue-500",
  },
  intervention_assigned: {
    Icon: UserCheck,
    colorClass: "text-violet-600",
    dotClass: "bg-violet-500",
  },
  intervention_status: {
    Icon: ArrowRight,
    colorClass: "text-amber-600",
    dotClass: "bg-amber-400",
  },
  intervention_completed: {
    Icon: CheckCircle2,
    colorClass: "text-emerald-600",
    dotClass: "bg-emerald-500",
  },
  intervention_invoiced: {
    Icon: FileText,
    colorClass: "text-teal-600",
    dotClass: "bg-teal-500",
  },
  material_ordered: {
    Icon: Package,
    colorClass: "text-orange-600",
    dotClass: "bg-orange-400",
  },
  supplier_ordered: {
    Icon: Truck,
    colorClass: "text-rose-600",
    dotClass: "bg-rose-500",
  },
  email_sent: {
    Icon: Mail,
    colorClass: "text-blue-600",
    dotClass: "bg-blue-400",
  },
  email_received: {
    Icon: MailOpen,
    colorClass: "text-cyan-600",
    dotClass: "bg-cyan-400",
  },
  commission_calculated: {
    Icon: Coins,
    colorClass: "text-yellow-600",
    dotClass: "bg-yellow-400",
  },
  intervention_technician_declined: {
    Icon: UserX,
    colorClass: "text-rose-600",
    dotClass: "bg-rose-500",
  },
  intervention_returned_to_requests: {
    Icon: RotateCcw,
    colorClass: "text-orange-600",
    dotClass: "bg-orange-400",
  },
  intervention_deleted: {
    Icon: Trash2,
    colorClass: "text-red-700",
    dotClass: "bg-red-600",
  },
  intervention_report_validated: {
    Icon: FileCheck,
    colorClass: "text-teal-700",
    dotClass: "bg-teal-500",
  },
  intervention_cancelled: {
    Icon: Ban,
    colorClass: "text-red-600",
    dotClass: "bg-red-500",
  },
  intervention_schedule_updated: {
    Icon: CalendarClock,
    colorClass: "text-indigo-600",
    dotClass: "bg-indigo-400",
  },
  intervention_billing_updated: {
    Icon: FileText,
    colorClass: "text-slate-700",
    dotClass: "bg-slate-500",
  },
  intervention_payment_updated: {
    Icon: CreditCard,
    colorClass: "text-emerald-700",
    dotClass: "bg-emerald-500",
  },
  intervention_terrain_report_received: {
    Icon: ClipboardList,
    colorClass: "text-violet-600",
    dotClass: "bg-violet-500",
  },
  bridged_report_dismissed: {
    Icon: XCircle,
    colorClass: "text-slate-600",
    dotClass: "bg-slate-400",
  },
  ivana_chat_message: {
    Icon: MessageCircle,
    colorClass: "text-sky-600",
    dotClass: "bg-sky-400",
  },
  material_order_status_changed: {
    Icon: Package,
    colorClass: "text-orange-700",
    dotClass: "bg-orange-500",
  },
  supplier_order_lecot: {
    Icon: Truck,
    colorClass: "text-amber-700",
    dotClass: "bg-amber-500",
  },
  chatbot_intervention_status: {
    Icon: ArrowRight,
    colorClass: "text-purple-600",
    dotClass: "bg-purple-400",
  },
  chatbot_timeline_comment: {
    Icon: MessageCircle,
    colorClass: "text-purple-700",
    dotClass: "bg-purple-500",
  },
  chatbot_email_sent: {
    Icon: Mail,
    colorClass: "text-blue-700",
    dotClass: "bg-blue-500",
  },
  chatbot_gmail_action: {
    Icon: MailOpen,
    colorClass: "text-blue-600",
    dotClass: "bg-blue-400",
  },
  chatbot_write_action: {
    Icon: ClipboardList,
    colorClass: "text-purple-800",
    dotClass: "bg-purple-600",
  },
  quote_created: {
    Icon: ClipboardList,
    colorClass: "text-sky-600",
    dotClass: "bg-sky-500",
  },
  quote_status_changed: {
    Icon: FileCheck,
    colorClass: "text-emerald-600",
    dotClass: "bg-emerald-500",
  },
};

function formatTime(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" });
}

function groupByDate(events: CrmActivityEvent[]): Map<string, CrmActivityEvent[]> {
  const map = new Map<string, CrmActivityEvent[]>();
  for (const e of events) {
    const key = formatDate(e.ts);
    const bucket = map.get(key) ?? [];
    bucket.push(e);
    map.set(key, bucket);
  }
  return map;
}

function EventRow({
  event,
  onClick,
  isNew,
}: {
  event: CrmActivityEvent;
  onClick?: (e: CrmActivityEvent) => void;
  isNew?: boolean;
}) {
  const { t } = useTranslation();
  const meta = EVENT_META[event.type];
  const { Icon, colorClass, dotClass } = meta;
  const isClickable = Boolean(event.interventionId && onClick);

  const subtitle =
    event.emailSubject ??
    event.clientName ??
    event.address ??
    event.orderLabel ??
    null;

  const statusLabel = (code: string | undefined) => {
    if (!code) return null;
    if (event.type === "quote_status_changed") {
      return String(t(`quotes.status.${code}` as any)) || code;
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
      onClick={isClickable ? () => onClick!(event) : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick!(event);
            }
          : undefined
      }
      className={cn(
        "group relative flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/80 crm-animate-item",
        isClickable && "cursor-pointer hover:shadow-sm",
        isNew && "crm-event-row--new bg-blue-50/90 ring-1 ring-blue-200/80 shadow-sm",
      )}
    >
      {/* dot */}
      <div className="relative flex flex-col items-center pt-1">
        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotClass}`} />
      </div>

      {/* icon */}
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/70 shadow-sm ${colorClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[13px] font-semibold text-slate-800 leading-tight">
            {t(`crmHistory.event.${event.type}`)}
          </span>
          {statusBadge}
          {event.interventionTitle && (
            <span className="text-[12px] text-slate-500 truncate">
              — {event.interventionTitle}
            </span>
          )}
        </div>
        {subtitle && (
          <span className="mt-0.5 text-[11px] text-slate-400 truncate">{subtitle}</span>
        )}
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
            {event.commissionAmountEuros.toFixed(2)} €{event.commissionAction ? ` — ${event.commissionAction}` : ""}
          </span>
        )}
        {(event.type === "email_sent" || event.type === "email_received") && event.emailFrom && (
          <span className="mt-0.5 text-[11px] text-slate-400 truncate">
            {event.type === "email_sent" ? `→ ${event.emailTo}` : `← ${event.emailFrom}`}
          </span>
        )}
      </div>

      {/* time */}
      <span className="flex-shrink-0 text-[11px] text-slate-400 pt-0.5">
        {formatTime(event.ts)}
      </span>
    </div>
  );
}

type Props = {
  events: CrmActivityEvent[];
  loading: boolean;
  refreshing?: boolean;
  live?: boolean;
  newEventIds?: Set<string>;
  feedError?: string | null;
  onEventClick?: (event: CrmActivityEvent) => void;
};

export default function CrmHistoryCenterFeed({
  events,
  loading,
  refreshing = false,
  live = false,
  newEventIds,
  feedError,
  onEventClick,
}: Props) {
  const { t } = useTranslation();



  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={outfit}>
        <div
          data-testid="crm-center-loading"
          className="flex flex-1 items-center justify-center gap-2 text-slate-400"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-[13px]">{t("crmHistory.loading")}</span>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={outfit}>
        <div
          data-testid="crm-center-empty"
          className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400"
        >
          <Inbox className="h-10 w-10 opacity-30" />
          <span className="text-[14px]">{t("crmHistory.empty")}</span>
        </div>
      </div>
    );
  }

  const groups = groupByDate(events);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      data-testid="crm-center-feed"
      style={outfit}
    >
      <style>{`
        @keyframes crmSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .crm-animate-item {
          animation: crmSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
      {feedError ? (
        <p
          className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900"
          data-testid="crm-feed-error"
          role="status"
        >
          {feedError}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto gap-4 p-4">
      {Array.from(groups.entries()).map(([date, evts]) => (
        <section key={date}>
          <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 bg-white/60 py-1 backdrop-blur-sm rounded-lg px-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {date}
            </span>
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {evts.length}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            {evts.map((e) => (
              <EventRow
                key={e.id}
                event={e}
                onClick={onEventClick}
                isNew={newEventIds?.has(e.id)}
              />
            ))}
          </div>
        </section>
      ))}
      </div>
    </div>
  );
}
