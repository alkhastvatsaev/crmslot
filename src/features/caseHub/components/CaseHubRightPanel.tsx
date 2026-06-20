"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import UnifiedInterventionDrawer from "@/features/interventions/components/UnifiedInterventionDrawer";
import CaseHubStepHeader from "@/features/caseHub/components/CaseHubStepHeader";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import { resolveInterventionClientName } from "@/features/interventions/resolveInterventionClientName";

type Props = {
  intervention: Intervention | null;
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  assigned: "bg-blue-100 text-blue-700 border-blue-200",
  en_route: "bg-indigo-100 text-indigo-700 border-indigo-200",
  in_progress: "bg-violet-100 text-violet-700 border-violet-200",
  waiting_material: "bg-amber-100 text-amber-800 border-amber-200",
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
  invoiced: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
  pending_needs_address: "bg-orange-100 text-orange-800 border-orange-200",
};

/** Step 3 — Agir : pilotage du dossier sélectionné + statut + prochaine étape. */
export default function CaseHubRightPanel({ intervention }: Props) {
  const { t } = useTranslation();

  if (!intervention) {
    return (
      <div
        data-testid="case-hub-right-panel"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <CaseHubStepHeader
          step={3}
          title={t("caseHub.steps.act_title")}
          hint={t("caseHub.steps.act_hint")}
          testId="case-hub-step-act"
        />
        <div
          data-testid="case-hub-empty-detail"
          className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center text-[12px] text-slate-400"
        >
          {t("caseHub.pick_case")}
        </div>
      </div>
    );
  }

  const title =
    resolveInterventionClientName(intervention) || intervention.title || intervention.id;
  const status = intervention.status ?? "pending";
  const statusLabel = t(`caseHub.status.${status}` as "caseHub.status.pending");
  const nextAction = t(`caseHub.next_action.${status}` as "caseHub.next_action.pending");

  return (
    <div
      data-testid="case-hub-right-panel"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <CaseHubStepHeader
        step={3}
        title={t("caseHub.steps.act_title")}
        hint={t("caseHub.steps.act_hint")}
        testId="case-hub-step-act"
      />
      <div className="shrink-0 border-b border-black/[0.05] bg-gradient-to-b from-sky-50/60 to-white px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {t("caseHub.selected_label")}
        </p>
        <p
          data-testid="case-hub-selected-title"
          className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900"
        >
          {title}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            data-testid={`case-hub-status-${status}`}
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              STATUS_BADGE[status] ?? STATUS_BADGE.pending
            )}
          >
            {statusLabel}
          </span>
          <span
            data-testid="case-hub-next-action"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600"
          >
            <ArrowRight className="h-3 w-3 text-slate-400" aria-hidden />
            {nextAction}
          </span>
        </div>
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
