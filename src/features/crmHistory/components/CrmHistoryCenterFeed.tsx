"use client";

import { useMemo } from "react";
import {
  FilePlus,
  UserCheck,
  ArrowRight,
  ArrowLeft,
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
  Clock,
  CreditCard,
  Ban,
  XCircle,
  ExternalLink,
  Navigation,
  Eye,
  MousePointer,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { statusLabelKey } from "@/features/interventions/technicianSchedule";
import { buildCrmActivityEventDetail } from "../crmActivityEventDetail";
import type { CrmActivityEvent, CrmEventType } from "../crmActivityTypes";
import type { Intervention } from "@/features/interventions/types";

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
  time_entry_recorded: {
    Icon: Clock,
    colorClass: "text-sky-600",
    dotClass: "bg-sky-400",
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
  intervention_report_rejected: {
    Icon: RotateCcw,
    colorClass: "text-amber-700",
    dotClass: "bg-amber-500",
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
  page_navigated: {
    Icon: Navigation,
    colorClass: "text-slate-400",
    dotClass: "bg-slate-300",
  },
  intervention_viewed: {
    Icon: Eye,
    colorClass: "text-slate-500",
    dotClass: "bg-slate-400",
  },
  email_viewed: {
    Icon: MousePointer,
    colorClass: "text-slate-500",
    dotClass: "bg-slate-400",
  },
  user_session_start: {
    Icon: LogIn,
    colorClass: "text-green-600",
    dotClass: "bg-green-500",
  },
};

function QmStatsGrid({ events }: { events: CrmActivityEvent[] }) {
  const s = useMemo(() => {
    let created = 0,
      completed = 0,
      invoiced = 0;
    let cancelled = 0,
      declined = 0,
      returned = 0;
    let materials = 0,
      emails = 0,
      billing = 0;
    for (const e of events) {
      if (e.type === "intervention_created") created++;
      else if (e.type === "intervention_completed") completed++;
      else if (e.type === "intervention_invoiced") invoiced++;
      else if (e.type === "intervention_cancelled") cancelled++;
      else if (e.type === "intervention_technician_declined") declined++;
      else if (e.type === "intervention_returned_to_requests") returned++;
      else if (
        e.type === "material_ordered" ||
        e.type === "supplier_ordered" ||
        e.type === "supplier_order_lecot"
      )
        materials++;
      else if (e.type === "email_sent" || e.type === "email_received") emails++;
      else if (
        e.type === "intervention_billing_updated" ||
        e.type === "intervention_payment_updated"
      )
        billing++;
    }
    const rate = created > 0 ? Math.round((completed / created) * 100) : null;
    return {
      created,
      completed,
      rate,
      invoiced,
      cancelled,
      declined,
      returned,
      materials,
      emails,
      billing,
    };
  }, [events]);

  const cells: { value: string | number; label: string; accent: string; bg: string }[] = [
    { value: s.created, label: "Créées", accent: "text-blue-600", bg: "bg-blue-50/60" },
    { value: s.completed, label: "Clôturées", accent: "text-emerald-600", bg: "bg-emerald-50/60" },
    {
      value: s.rate !== null ? `${s.rate}%` : "—",
      label: "Taux",
      accent:
        s.rate === null
          ? "text-slate-400"
          : s.rate >= 70
            ? "text-emerald-600"
            : s.rate >= 40
              ? "text-amber-500"
              : "text-red-500",
      bg: "bg-white/60",
    },
    {
      value: s.cancelled,
      label: "Annulées",
      accent: s.cancelled > 0 ? "text-rose-500" : "text-slate-400",
      bg: "bg-rose-50/40",
    },
    {
      value: s.declined,
      label: "Refus tech",
      accent: s.declined > 0 ? "text-rose-400" : "text-slate-400",
      bg: "bg-rose-50/40",
    },
    {
      value: s.returned,
      label: "Retours",
      accent: s.returned > 0 ? "text-orange-500" : "text-slate-400",
      bg: "bg-orange-50/40",
    },
    { value: s.invoiced, label: "Facturées", accent: "text-teal-600", bg: "bg-teal-50/50" },
    { value: s.materials, label: "Matériaux", accent: "text-orange-600", bg: "bg-orange-50/50" },
    { value: s.emails, label: "Emails", accent: "text-sky-600", bg: "bg-sky-50/50" },
  ];

  return (
    <div className="shrink-0 grid grid-cols-3 gap-px border-b border-black/5 bg-black/5">
      {cells.map(({ value, label, accent, bg }) => (
        <div key={label} className={`flex flex-col items-center justify-center py-3 gap-0.5 ${bg}`}>
          <span className={`text-[20px] font-bold tabular-nums leading-none ${accent}`}>
            {value}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatTime(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
}

function EventCard({
  event,
  onSelect,
  isNew,
  isSelected,
  index,
}: {
  event: CrmActivityEvent;
  onSelect?: (e: CrmActivityEvent) => void;
  isNew?: boolean;
  isSelected?: boolean;
  index: number;
}) {
  const { t } = useTranslation();
  const meta = EVENT_META[event.type];
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
      {/* sequence number top-left */}
      <span className="absolute top-2 left-2.5 text-[9px] font-bold tabular-nums text-slate-300">
        {index + 1}
      </span>
      {isNew && <span className={`absolute top-2 right-2 h-1.5 w-1.5 rounded-full ${dotClass}`} />}

      {/* time — anchor chronologique */}
      <span className="text-[11px] font-semibold tabular-nums text-slate-500 leading-none">
        {formatTime(event.ts)}
      </span>

      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm ${colorClass}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="flex flex-col gap-0.5 w-full">
        <span className="text-[10px] font-semibold leading-tight text-slate-700 line-clamp-2">
          {t(`crmHistory.event.${event.type}`)}
        </span>
        {subtitle && <span className="text-[9px] text-slate-400 truncate">{subtitle}</span>}
      </div>
    </div>
  );
}

function EventRow({
  event,
  onSelect,
  isNew,
  isSelected,
}: {
  event: CrmActivityEvent;
  onSelect?: (e: CrmActivityEvent) => void;
  isNew?: boolean;
  isSelected?: boolean;
}) {
  const { t } = useTranslation();
  const meta = EVENT_META[event.type];
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

      {/* time */}
      <span className="flex-shrink-0 text-[11px] text-slate-400 pt-0.5">
        {formatTime(event.ts)}
      </span>
    </div>
  );
}

function formatDateTime(ts: number): string {
  if (!ts) return "";
  return new Date(ts).toLocaleString("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventDetailInline({
  event,
  onBack,
  onOpenIntervention,
}: {
  event: CrmActivityEvent;
  onBack: () => void;
  onOpenIntervention?: (e: CrmActivityEvent) => void;
}) {
  const { t } = useTranslation();
  const meta = EVENT_META[event.type];
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
      {/* Header */}
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
            {t(`crmHistory.event.${event.type}`)}
          </span>
          <time className="text-[11px] text-slate-400">{formatDateTime(event.ts)}</time>
        </div>
      </div>

      {/* Body */}
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

      {/* Footer */}
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

type Props = {
  events: CrmActivityEvent[];
  loading: boolean;
  refreshing?: boolean;
  live?: boolean;
  newEventIds?: Set<string>;
  feedError?: string | null;
  selectedEventId?: string | null;
  onEventSelect?: (event: CrmActivityEvent) => void;
  selectedEvent?: CrmActivityEvent | null;
  onClearSelection?: () => void;
  onOpenIntervention?: (event: CrmActivityEvent) => void;
};

export default function CrmHistoryCenterFeed({
  events,
  loading,
  refreshing = false,
  live = false,
  newEventIds,
  feedError,
  selectedEventId,
  onEventSelect,
  selectedEvent,
  onClearSelection,
  onOpenIntervention,
}: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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

  if (selectedEvent) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden" data-testid="crm-center-feed">
        <EventDetailInline
          event={selectedEvent}
          onBack={() => onClearSelection?.()}
          onOpenIntervention={onOpenIntervention}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" data-testid="crm-center-feed">
      <style>{`
        @keyframes crmSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .crm-animate-item { animation: crmSlideIn 0.3s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>
      {refreshing && (
        <div className="shrink-0 flex items-center justify-center gap-1.5 py-1 text-[11px] text-slate-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Mise à jour…
        </div>
      )}
      {feedError ? (
        <p
          className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900"
          data-testid="crm-feed-error"
          role="status"
        >
          {feedError}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto gap-5 p-4">
        <div className="grid grid-cols-3 gap-2">
          {events.map((e, i) => (
            <EventCard
              key={e.id}
              event={e}
              onSelect={onEventSelect}
              isNew={newEventIds?.has(e.id)}
              isSelected={selectedEventId === e.id}
              index={i}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
