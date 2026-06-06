"use client";

import { useMemo } from "react";
import { ExternalLink, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { buildCrmActivityEventDetail } from "@/features/crmHistory/crmActivityEventDetail";
import type { CrmActivityEvent } from "@/features/crmHistory/crmActivityTypes";

function formatSelectedDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return "aujourd'hui";
  return date.toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" });
}

function QmSnapshotPanel({ events, dateLabel }: { events: CrmActivityEvent[]; dateLabel: string }) {
  const snapshot = useMemo(() => {
    let created = 0,
      completed = 0,
      invoiced = 0;
    let cancelled = 0,
      declined = 0,
      returned = 0;
    let materials = 0,
      emails = 0,
      billing = 0;
    let quotes = 0,
      assigned = 0,
      reports = 0,
      scheduled = 0,
      chatbot = 0;
    let orderCents = 0;

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
      else if (e.type === "quote_created" || e.type === "quote_status_changed") quotes++;
      else if (e.type === "intervention_assigned") assigned++;
      else if (
        e.type === "intervention_report_validated" ||
        e.type === "intervention_terrain_report_received"
      )
        reports++;
      else if (e.type === "intervention_schedule_updated") scheduled++;

      if (
        e.type === "chatbot_intervention_status" ||
        e.type === "chatbot_timeline_comment" ||
        e.type === "chatbot_email_sent" ||
        e.type === "chatbot_gmail_action" ||
        e.type === "chatbot_write_action"
      )
        chatbot++;
      if (e.orderTotalCents) orderCents += e.orderTotalCents;
    }

    const rate = created > 0 ? Math.round((completed / created) * 100) : null;
    const caMat =
      orderCents > 0
        ? orderCents >= 100000
          ? `${(orderCents / 100000).toFixed(1)}k€`
          : `${Math.round(orderCents / 100)}€`
        : "—";

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
      quotes,
      assigned,
      reports,
      scheduled,
      chatbot,
      caMat,
    };
  }, [events]);

  const statCells: { value: string | number; label: string; accent: string; bg: string }[] = [
    { value: snapshot.created, label: "Créées", accent: "text-blue-600", bg: "bg-blue-50/60" },
    {
      value: snapshot.completed,
      label: "Clôturées",
      accent: "text-emerald-600",
      bg: "bg-emerald-50/60",
    },
    {
      value: snapshot.rate !== null ? `${snapshot.rate}%` : "—",
      label: "Taux",
      accent:
        snapshot.rate === null
          ? "text-slate-400"
          : snapshot.rate >= 70
            ? "text-emerald-600"
            : snapshot.rate >= 40
              ? "text-amber-500"
              : "text-red-500",
      bg: "bg-white/60",
    },
    {
      value: snapshot.assigned,
      label: "Assignées",
      accent: "text-violet-600",
      bg: "bg-violet-50/50",
    },
    {
      value: snapshot.scheduled,
      label: "Planifiées",
      accent: "text-indigo-500",
      bg: "bg-indigo-50/40",
    },
    { value: snapshot.reports, label: "Rapports", accent: "text-teal-600", bg: "bg-teal-50/50" },
    {
      value: snapshot.cancelled,
      label: "Annulées",
      accent: snapshot.cancelled > 0 ? "text-rose-500" : "text-slate-400",
      bg: "bg-rose-50/40",
    },
    {
      value: snapshot.declined,
      label: "Refus tech",
      accent: snapshot.declined > 0 ? "text-rose-400" : "text-slate-400",
      bg: "bg-rose-50/40",
    },
    {
      value: snapshot.returned,
      label: "Retours",
      accent: snapshot.returned > 0 ? "text-orange-500" : "text-slate-400",
      bg: "bg-orange-50/40",
    },
    { value: snapshot.invoiced, label: "Facturées", accent: "text-teal-600", bg: "bg-teal-50/50" },
    { value: snapshot.quotes, label: "Devis", accent: "text-sky-600", bg: "bg-sky-50/50" },
    {
      value: snapshot.caMat,
      label: "CA mat.",
      accent: snapshot.caMat === "—" ? "text-slate-400" : "text-orange-600",
      bg: "bg-orange-50/50",
    },
    {
      value: snapshot.materials,
      label: "Matériaux",
      accent: "text-orange-600",
      bg: "bg-orange-50/50",
    },
    { value: snapshot.emails, label: "Emails", accent: "text-sky-600", bg: "bg-sky-50/50" },
    { value: snapshot.chatbot, label: "Chat IA", accent: "text-purple-600", bg: "bg-purple-50/50" },
  ];

  const hasActivity = events.length > 0;

  if (!hasActivity) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-slate-400">
        <TrendingUp className="h-8 w-8 opacity-20" />
        <p className="text-[13px]">Aucune activité {dateLabel}.</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      <div className="grid grid-cols-3 gap-2">
        {statCells.map(({ value, label, accent, bg }) => (
          <div
            key={label}
            className={`aspect-square flex flex-col items-center justify-center gap-1 rounded-2xl border border-black/5 shadow-sm ${bg}`}
          >
            <span className={`text-[20px] font-bold tabular-nums leading-none ${accent}`}>
              {value}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
              {label}
            </span>
          </div>
        ))}
      </div>
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
        <QmSnapshotPanel events={allEvents} dateLabel={dateLabel} />
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
          {t(`crmHistory.event.${event.type}`)}
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
