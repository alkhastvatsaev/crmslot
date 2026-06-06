"use client";

import { useMemo } from "react";
import { ExternalLink, AlertTriangle, TrendingUp, UserCheck, UserX, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { buildCrmActivityEventDetail } from "@/features/crmHistory/crmActivityEventDetail";
import type { CrmActivityEvent, CrmPeriodFilter } from "@/features/crmHistory/crmActivityTypes";

const PERIOD_LABEL: Record<CrmPeriodFilter, string> = {
  today: "aujourd'hui",
  week: "cette semaine",
  month: "ce mois",
  all: "sur toute la période",
};

function QmSnapshotPanel({
  events,
  period,
}: {
  events: CrmActivityEvent[];
  period: CrmPeriodFilter;
}) {
  const snapshot = useMemo(() => {
    const problems: { label: string; client: string | null }[] = [];
    const techCompletions: Record<string, number> = {};
    const techDeclines: Record<string, number> = {};

    for (const e of events) {
      if (
        e.type === "intervention_cancelled" ||
        e.type === "intervention_deleted" ||
        e.type === "intervention_returned_to_requests"
      ) {
        problems.push({
          label: e.interventionTitle ?? e.type.replace("intervention_", "").replace(/_/g, " "),
          client: e.clientName ?? null,
        });
      }
      if (e.type === "intervention_technician_declined" && e.technicianUid) {
        techDeclines[e.technicianUid] = (techDeclines[e.technicianUid] ?? 0) + 1;
      }
      if (e.type === "intervention_completed" && e.technicianUid) {
        techCompletions[e.technicianUid] = (techCompletions[e.technicianUid] ?? 0) + 1;
      }
    }

    const topDeclines = Object.entries(techDeclines)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const topCompletions = Object.entries(techCompletions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return { problems: problems.slice(0, 5), topDeclines, topCompletions };
  }, [events]);

  const hasProblems = snapshot.problems.length > 0;
  const hasPerf = snapshot.topCompletions.length > 0 || snapshot.topDeclines.length > 0;

  if (!hasProblems && !hasPerf) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-slate-400">
        <TrendingUp className="h-8 w-8 opacity-20" />
        <p className="text-[13px]">Aucune activité {PERIOD_LABEL[period]}.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 gap-6">
      {hasProblems && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Points d&apos;attention
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {snapshot.problems.map((p, i) => (
              <div key={i} className="rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2.5">
                <p className="text-[13px] font-semibold text-slate-800 leading-snug capitalize">
                  {p.label}
                </p>
                {p.client && <p className="text-[11px] text-slate-400 mt-0.5">{p.client}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {snapshot.topCompletions.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Top clôtures
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {snapshot.topCompletions.map(([uid, count]) => (
              <div
                key={uid}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/60 border border-emerald-100"
              >
                <span className="text-[12px] font-medium text-slate-700 truncate">{uid}</span>
                <span className="text-[13px] font-bold text-emerald-600 ml-2">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {snapshot.topDeclines.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <UserX className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Refus technicien
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {snapshot.topDeclines.map(([uid, count]) => (
              <div
                key={uid}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-rose-50/60 border border-rose-100"
              >
                <span className="text-[12px] font-medium text-slate-700 truncate">{uid}</span>
                <span className="text-[13px] font-bold text-rose-500 ml-2">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}
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
  period?: CrmPeriodFilter;
};

export default function CrmHistoryEventDetailPanel({
  event,
  onOpenIntervention,
  allEvents = [],
  period = "all",
}: Props) {
  const { t } = useTranslation();

  if (!event) {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        data-testid="crm-history-detail-empty"
      >
        <header className="shrink-0 border-b border-black/5 px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Quality Snapshot
          </p>
          <h2 className="mt-1 text-[16px] font-semibold text-slate-900">Vue qualité</h2>
          <p className="mt-0.5 text-[11px] text-slate-400 capitalize">{PERIOD_LABEL[period]}</p>
        </header>
        <QmSnapshotPanel events={allEvents} period={period} />
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
