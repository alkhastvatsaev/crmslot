"use client";

import { useState } from "react";
import { Loader2, MessageCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";
import { assignInterventionFromBackoffice } from "@/features/backoffice/assignInterventionFromBackoffice";
import TechnicianAssignPicker from "@/features/dispatch/components/TechnicianAssignPicker";
import type { CaseHubDetailSnapshot } from "@/features/caseHub/caseHubInterventionDetail";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  intervention: Intervention;
  peerInterventions: Intervention[];
  snapshot: CaseHubDetailSnapshot;
};

export default function CaseHubDetailActions({ intervention, peerInterventions, snapshot }: Props) {
  const { t } = useTranslation();
  const [assignOpen, setAssignOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async (
    technicianUid: string,
    schedule?: { scheduledDate: string; scheduledTime: string }
  ) => {
    setIsAssigning(true);
    try {
      const result = await assignInterventionFromBackoffice(
        intervention.id,
        intervention,
        technicianUid,
        schedule
      );
      if (result?.rescheduled) {
        toast.success(String(t("caseHub.actions.assign_rescheduled")));
      } else {
        toast.success(String(t("caseHub.actions.assign_ok")));
      }
      setAssignOpen(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(t("caseHub.actions.assign_failed"));
      toast.error(message);
    } finally {
      setIsAssigning(false);
    }
  };

  const whatsappHref = snapshot.whatsapp
    ? `https://wa.me/${snapshot.whatsapp.replace(/\D/g, "")}`
    : null;

  const hasActions = snapshot.canAssignTechnician || whatsappHref;

  if (!hasActions) return null;

  return (
    <div
      data-testid="case-hub-detail-actions"
      className="flex shrink-0 flex-col gap-2 border-b border-black/[0.05] bg-white px-4 py-3"
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {t("caseHub.right.actions")}
      </p>

      {snapshot.canAssignTechnician ? (
        assignOpen ? (
          <TechnicianAssignPicker
            className="max-h-[320px] min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80"
            intervention={intervention}
            peerInterventions={peerInterventions}
            isAssigning={isAssigning}
            onCancel={() => setAssignOpen(false)}
            onAssign={handleAssign}
          />
        ) : (
          <button
            type="button"
            data-testid="case-hub-assign-open"
            onClick={() => setAssignOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-bold text-rose-900 transition hover:bg-rose-100"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            {t("caseHub.actions.assign_technician")}
          </button>
        )
      ) : null}

      {isAssigning ? (
        <div className="flex items-center justify-center gap-2 py-1 text-[11px] text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          {t("caseHub.actions.assigning")}
        </div>
      ) : null}

      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="case-hub-whatsapp-client"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-[12px] font-semibold text-green-900 transition hover:bg-green-100"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          {t("caseHub.actions.whatsapp")} · {snapshot.whatsapp}
        </a>
      ) : null}
    </div>
  );
}
