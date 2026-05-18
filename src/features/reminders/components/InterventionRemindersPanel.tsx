"use client";

import { useMemo } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { openBackofficeIntervention } from "@/features/backoffice/openBackofficeIntervention";
import type { Intervention } from "@/features/interventions/types";
import { buildInterventionReminders } from "@/features/reminders/interventionReminders";

type Props = {
  interventions: Intervention[];
};

export default function InterventionRemindersPanel({ interventions }: Props) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("pwaV2Bundle");
  const pager = useDashboardPagerOptional();
  const inboxIntent = useBackofficeInboxIntentOptional();
  const reminders = useMemo(() => buildInterventionReminders(interventions), [interventions]);

  if (!enabled || reminders.length === 0) return null;

  return (
    <section data-testid="intervention-reminders-panel" className="rounded-xl border border-amber-100 bg-amber-50/80 p-3">
      <p className="mb-2 text-xs font-bold uppercase text-amber-800">{t("reminders.title")}</p>
      <ul className="space-y-1">
        {reminders.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              data-testid={`reminder-row-${r.interventionId}`}
              onClick={() =>
                openBackofficeIntervention(pager, inboxIntent?.setPendingInboxId, r.interventionId)
              }
              className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/80"
            >
              {r.severity === "warning" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              )}
              <span>{t(r.labelKey)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
