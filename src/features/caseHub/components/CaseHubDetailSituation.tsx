"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import CaseHubDetailStep from "@/features/caseHub/components/CaseHubDetailStep";
import { CASE_HUB_DETAIL, CASE_HUB_STATUS_DOT } from "@/features/caseHub/caseHubDetailTheme";
import type { CaseHubDetailSnapshot } from "@/features/caseHub/caseHubInterventionDetail";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  intervention: Intervention;
  snapshot: CaseHubDetailSnapshot;
  statusLabel: string;
  nextAction: string;
};

/** Étape 1 — Qui, quoi, prochaine action. */
export default function CaseHubDetailSituation({
  intervention,
  snapshot,
  statusLabel,
  nextAction,
}: Props) {
  const { t } = useTranslation();
  const status = intervention.status ?? "pending";
  const dotClass = CASE_HUB_STATUS_DOT[status] ?? CASE_HUB_STATUS_DOT.pending;

  return (
    <CaseHubDetailStep
      step={1}
      title={t("caseHub.pipeline.step_situation")}
      testId="case-hub-detail-summary"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 data-testid="case-hub-selected-title" className={CASE_HUB_DETAIL.title}>
              {snapshot.clientName}
            </h2>
            <p className={CASE_HUB_DETAIL.subtitle}>
              {t("caseHub.right.case_id").replace("{{id}}", snapshot.shortId)}
            </p>
          </div>
          <span data-testid={`case-hub-status-${status}`} className={CASE_HUB_DETAIL.statusPill}>
            <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
            {statusLabel}
          </span>
        </div>

        {snapshot.problemPreview ? (
          <p data-testid="case-hub-problem-preview" className={CASE_HUB_DETAIL.body}>
            {snapshot.problemPreview}
          </p>
        ) : null}

        <div data-testid="case-hub-next-action" className={CASE_HUB_DETAIL.nextActionInline}>
          <ArrowRight className="h-4 w-4 shrink-0 text-white" aria-hidden />
          <span className={cn(CASE_HUB_DETAIL.nextActionText, "text-white")}>{nextAction}</span>
        </div>
      </div>
    </CaseHubDetailStep>
  );
}
