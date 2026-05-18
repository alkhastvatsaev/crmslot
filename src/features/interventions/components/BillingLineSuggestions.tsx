"use client";

import { Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import type { BillingLine } from "@/features/interventions/components/TechnicianBillingLinesForm";
import { suggestBillingLinesFromProblem } from "@/features/interventions/suggestBillingLines";

type Props = {
  problem?: string | null;
  category?: string | null;
  onApply: (lines: BillingLine[]) => void;
};

export default function BillingLineSuggestions({ problem, category, onApply }: Props) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("pwaV2Bundle");
  const suggestions = useMemo(
    () => suggestBillingLinesFromProblem(problem?.trim() ?? "", category),
    [problem, category],
  );

  if (!enabled || suggestions.length === 0) return null;

  return (
    <div
      data-testid="billing-line-suggestions"
      className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2"
    >
      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-violet-800">
        <Sparkles className="h-3.5 w-3.5" />
        {t("billing_lines.suggestions_title")}
      </p>
      <button
        type="button"
        data-testid="billing-line-suggestions-apply"
        onClick={() => onApply(suggestions)}
        className="text-xs font-semibold text-violet-700 underline-offset-2 hover:underline"
      >
        {t("billing_lines.suggestions_apply").replace("{count}", String(suggestions.length))}
      </button>
    </div>
  );
}
