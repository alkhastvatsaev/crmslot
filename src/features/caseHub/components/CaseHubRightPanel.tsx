"use client";

import UnifiedInterventionDrawer from "@/features/interventions/components/UnifiedInterventionDrawer";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import { resolveInterventionClientName } from "@/features/interventions/resolveInterventionClientName";

type Props = {
  intervention: Intervention | null;
};

export default function CaseHubRightPanel({ intervention }: Props) {
  const { t } = useTranslation();

  if (!intervention) {
    return (
      <div
        data-testid="case-hub-empty-detail"
        className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center text-[12px] text-slate-400"
      >
        {t("caseHub.pick_case")}
      </div>
    );
  }

  const title =
    resolveInterventionClientName(intervention) || intervention.title || intervention.id;

  return (
    <div
      data-testid="case-hub-right-panel"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="shrink-0 border-b border-black/[0.05] bg-white/80 px-4 py-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {t("caseHub.selected_label")}
        </p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{title}</p>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
        <UnifiedInterventionDrawer
          intervention={intervention}
          technicianUid={intervention.assignedTechnicianUid ?? ""}
          allowMaterialCreate
          allowMaterialStatusUpdate
          className="min-h-[420px]"
        />
      </div>
    </div>
  );
}
