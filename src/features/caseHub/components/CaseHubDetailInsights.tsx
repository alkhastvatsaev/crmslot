"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type {
  CaseHubInsight,
  CaseHubInsightTone,
} from "@/features/caseHub/caseHubInterventionDetail";

const INSIGHT_TONE: Record<CaseHubInsightTone, string> = {
  rose: "border-rose-200 bg-rose-50 text-rose-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  sky: "border-sky-200 bg-sky-50 text-sky-900",
  violet: "border-violet-200 bg-violet-50 text-violet-900",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

type Props = {
  insights: CaseHubInsight[];
};

/** Déductions automatiques sur un dossier (âge, retard, marge, récurrence…). */
export default function CaseHubDetailInsights({ insights }: Props) {
  const { t } = useTranslation();

  if (insights.length === 0) return null;

  return (
    <div
      data-testid="case-hub-detail-insights"
      className="flex shrink-0 flex-col gap-2 border-b border-black/[0.05] bg-white px-4 py-3"
    >
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <Sparkles className="h-3 w-3" aria-hidden />
        {t("caseHub.right.insights")}
      </p>
      <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {insights.map((insight) => (
          <li
            key={insight.id}
            data-testid={`case-hub-insight-${insight.id}`}
            className={cn(
              "flex flex-col gap-0.5 rounded-xl border px-2.5 py-2",
              INSIGHT_TONE[insight.tone]
            )}
          >
            <span className="text-[16px] font-black leading-none tabular-nums">
              {insight.value}
            </span>
            <span className="text-[10px] font-semibold leading-tight">{t(insight.labelKey)}</span>
            {insight.detail || insight.detailKey ? (
              <span className="text-[10px] font-medium opacity-80">
                {insight.detailKey ? t(insight.detailKey) : insight.detail}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
