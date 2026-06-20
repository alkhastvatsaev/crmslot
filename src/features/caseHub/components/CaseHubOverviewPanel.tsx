"use client";

import CaseHubLeftRail from "@/features/caseHub/components/CaseHubLeftRail";
import CaseHubStepHeader from "@/features/caseHub/components/CaseHubStepHeader";
import type { CaseHubStatusFilter } from "@/features/caseHub/caseHubTypes";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  filter: CaseHubStatusFilter;
  counts: Record<CaseHubStatusFilter, number>;
  onFilterChange: (filter: CaseHubStatusFilter) => void;
};

/** Step 1 — Situation : filtres-compteurs (chaque chip = KPI + filtre interactif). */
export default function CaseHubOverviewPanel({ filter, counts, onFilterChange }: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="case-hub-overview-panel"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <CaseHubStepHeader
        step={1}
        title={t("caseHub.steps.overview_title")}
        hint={t("caseHub.steps.overview_hint")}
        testId="case-hub-step-overview"
      />
      <CaseHubLeftRail filter={filter} onFilterChange={onFilterChange} counts={counts} />
    </div>
  );
}
