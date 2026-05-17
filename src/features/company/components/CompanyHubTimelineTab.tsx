"use client";

import InterventionCaseTimeline from "@/features/interventions/components/InterventionCaseTimeline";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  interventionId?: string | null;
  companyId?: string | null;
};

export function CompanyHubTimelineTab({ interventionId = null, companyId = null }: Props) {
  const { t } = useTranslation();

  if (!interventionId) {
    return (
      <div
        data-testid="company-hub-timeline-empty"
        className="flex flex-1 flex-col items-center justify-center p-6 text-center text-[14px] text-slate-500"
      >
        {t("timeline.empty")}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <InterventionCaseTimeline
        interventionId={interventionId}
        companyId={companyId}
        allowComments={false}
        clientVisibleOnly
        className="min-h-0 flex-1"
      />
    </div>
  );
}
