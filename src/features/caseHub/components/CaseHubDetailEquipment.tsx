"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import EquipmentPanel from "@/features/equipment/components/EquipmentPanel";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  intervention: Intervention;
};

export default function CaseHubDetailEquipment({ intervention }: Props) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("equipmentInventory");
  const clientId = intervention.clientId?.trim();

  if (!enabled || !clientId) return null;

  return (
    <div
      data-testid="case-hub-detail-equipment"
      className="flex shrink-0 flex-col gap-2 border-b border-black/[0.05] px-4 py-3"
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {t("caseHub.right.equipment")}
      </p>
      <EquipmentPanel clientId={clientId} />
    </div>
  );
}
