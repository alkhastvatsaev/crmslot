"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import { HubCard, HUB_TYPE } from "@/core/ui/hub";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  selectedItem: Intervention;
  isInRequestsQueue: boolean;
};

export default function InterventionDetailProblemSection({
  selectedItem,
  isInRequestsQueue,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <span className={HUB_TYPE.eyebrow}>
        {isInRequestsQueue
          ? t("backoffice.inbox.problem_label")
          : t("backoffice.inbox.report_label")}
      </span>
      <HubCard tone="muted" padding="md">
        <p className="text-[15px] text-slate-800 leading-relaxed">
          {selectedItem.problem || t("backoffice.inbox.no_description_provided")}
        </p>
      </HubCard>
    </div>
  );
}
