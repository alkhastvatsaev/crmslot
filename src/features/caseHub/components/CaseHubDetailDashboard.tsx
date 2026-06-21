"use client";

import { useMemo } from "react";
import { AlertTriangle, Banknote, CalendarClock, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { formatPatronEuros } from "@/features/commissionsHub/commissionsHubFormat";
import { interventionBillingTotalCents } from "@/features/billingHub/billingHubMetrics";
import {
  bucketForIntervention,
  timeGroupForIntervention,
} from "@/features/caseHub/caseHubPatronMetrics";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  interventions: Intervention[];
  now?: Date;
};

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function buildAggregates(interventions: Intervention[], now: Date) {
  let toAssignToday = 0;
  let toInvoice = 0;
  let toInvoicePotentialCents = 0;
  let unpaidOverdue = 0;

  for (const iv of interventions) {
    const bucket = bucketForIntervention(iv);
    if (bucket === "to_assign") {
      const group = timeGroupForIntervention(iv, now);
      if (group === "today" || group === "overdue" || group === "no_date") toAssignToday += 1;
    }
    if (bucket === "to_invoice") {
      toInvoice += 1;
      toInvoicePotentialCents += interventionBillingTotalCents(iv);
    }
    if (bucket === "invoiced" && iv.invoicedAt) {
      const invoiced = new Date(iv.invoicedAt);
      if (Number.isFinite(invoiced.getTime()) && daysBetween(invoiced, now) >= 14) {
        unpaidOverdue += 1;
      }
    }
  }

  return { toAssignToday, toInvoice, toInvoicePotentialCents, unpaidOverdue };
}

export default function CaseHubDetailDashboard({ interventions, now = new Date() }: Props) {
  const { t } = useTranslation();
  const stats = useMemo(() => buildAggregates(interventions, now), [interventions, now]);
  const isCalm = stats.toAssignToday === 0 && stats.toInvoice === 0 && stats.unpaidOverdue === 0;

  return (
    <div
      data-testid="case-hub-detail-dashboard"
      className="flex min-h-0 flex-1 flex-col gap-5 px-5 py-6"
    >
      <header className="flex flex-col gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {t("caseHub.dashboard.title")}
        </p>
        <p className="text-[14px] leading-snug text-slate-500">
          {isCalm ? t("caseHub.dashboard.calm_hint") : t("caseHub.dashboard.hint")}
        </p>
      </header>

      {isCalm ? (
        <div
          data-testid="case-hub-dashboard-calm"
          className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl bg-slate-50 px-6 py-10 text-center"
        >
          <span className="text-3xl">☕️</span>
          <p className="text-[16px] font-semibold text-slate-700">
            {t("caseHub.dashboard.calm_title")}
          </p>
          <p className="text-[12px] text-slate-500">{t("caseHub.dashboard.calm_hint")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <DashboardTile
            testId="case-hub-dashboard-to-assign"
            icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
            label={t("caseHub.dashboard.to_assign_today")}
            value={stats.toAssignToday}
            tone="rose"
          />
          <DashboardTile
            testId="case-hub-dashboard-to-invoice"
            icon={<Receipt className="h-4 w-4" aria-hidden />}
            label={t("caseHub.dashboard.to_invoice")}
            value={stats.toInvoice}
            tone="emerald"
            sub={
              stats.toInvoicePotentialCents > 0
                ? t("caseHub.dashboard.to_invoice_potential").replace(
                    "{{amount}}",
                    formatPatronEuros(stats.toInvoicePotentialCents)
                  )
                : undefined
            }
          />
          <DashboardTile
            testId="case-hub-dashboard-unpaid"
            icon={<Banknote className="h-4 w-4" aria-hidden />}
            label={t("caseHub.dashboard.unpaid_overdue")}
            value={stats.unpaidOverdue}
            tone="sky"
          />
        </div>
      )}

      <p className="mt-auto inline-flex items-center gap-1.5 text-[11px] text-slate-400">
        <CalendarClock className="h-3.5 w-3.5" aria-hidden />
        {t("caseHub.pick_case")}
      </p>
    </div>
  );
}

const TILE_TONE: Record<string, { wrap: string; icon: string; value: string }> = {
  rose: {
    wrap: "bg-rose-50/70",
    icon: "bg-rose-100 text-rose-700",
    value: "text-rose-900",
  },
  emerald: {
    wrap: "bg-emerald-50/70",
    icon: "bg-emerald-100 text-emerald-700",
    value: "text-emerald-900",
  },
  sky: {
    wrap: "bg-sky-50/70",
    icon: "bg-sky-100 text-sky-700",
    value: "text-sky-900",
  },
};

function DashboardTile({
  testId,
  icon,
  label,
  value,
  sub,
  tone,
}: {
  testId: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  tone: "rose" | "emerald" | "sky";
}) {
  const palette = TILE_TONE[tone] ?? TILE_TONE.sky;
  const muted = value === 0;
  return (
    <div
      data-testid={testId}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3",
        muted ? "bg-slate-50" : palette.wrap
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          muted ? "bg-white text-slate-400" : palette.icon
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-slate-700">{label}</p>
        {sub ? <p className="truncate text-[11px] text-slate-500">{sub}</p> : null}
      </div>
      <span
        className={cn(
          "text-[24px] font-black tabular-nums leading-none",
          muted ? "text-slate-300" : palette.value
        )}
      >
        {value}
      </span>
    </div>
  );
}
