"use client";

import { cn } from "@/lib/utils";
import CaseHubListPanel from "@/features/caseHub/components/CaseHubListPanel";
import CaseHubStepHeader from "@/features/caseHub/components/CaseHubStepHeader";
import type { Intervention } from "@/features/interventions/types";
import type { CaseHubStatusFilter } from "@/features/caseHub/caseHubTypes";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  interventions: Intervention[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  filter: CaseHubStatusFilter;
};

const FILTER_BADGE: Record<CaseHubStatusFilter, string> = {
  all: "bg-slate-100 text-slate-700 border-slate-200",
  open: "bg-amber-100 text-amber-800 border-amber-200",
  active: "bg-violet-100 text-violet-800 border-violet-200",
  done: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

/** Step 2 — Choisir : liste des dossiers filtrés, avec badge du filtre actif (lien visuel panneau 1). */
export default function CaseHubChoosePanel({
  interventions,
  loading,
  selectedId,
  onSelect,
  filter,
}: Props) {
  const { t } = useTranslation();
  const filterLabel = t(`caseHub.filter.${filter}` as "caseHub.filter.all");

  return (
    <div
      data-testid="case-hub-choose-panel"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <CaseHubStepHeader
        step={2}
        title={t("caseHub.steps.choose_title")}
        hint={t("caseHub.steps.choose_hint").replace("{{filter}}", filterLabel)}
        testId="case-hub-step-choose"
      />
      <div className="flex shrink-0 items-center gap-2 border-b border-black/[0.05] bg-white/80 px-4 py-2">
        <span
          data-testid={`case-hub-active-filter-${filter}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
            FILTER_BADGE[filter]
          )}
        >
          {filterLabel}
          <span className="rounded-full bg-white/70 px-1.5 py-px text-[10px] tabular-nums">
            {interventions.length}
          </span>
        </span>
      </div>
      <CaseHubListPanel
        interventions={interventions}
        loading={loading}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </div>
  );
}
