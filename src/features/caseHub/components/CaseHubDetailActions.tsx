"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Mail, MapPin, MessageCircle, Phone, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { assignInterventionFromBackoffice } from "@/features/backoffice/assignInterventionFromBackoffice";
import TechnicianAssignPicker from "@/features/dispatch/components/TechnicianAssignPicker";
import CaseHubDetailStep from "@/features/caseHub/components/CaseHubDetailStep";
import { CASE_HUB_DETAIL } from "@/features/caseHub/caseHubDetailTheme";
import type { CaseHubDetailSnapshot } from "@/features/caseHub/caseHubInterventionDetail";
import type { Intervention } from "@/features/interventions";

type Props = {
  intervention: Intervention;
  peerInterventions: Intervention[];
  snapshot: CaseHubDetailSnapshot;
};

/** Étape 3 — Joindre le client + actions patron. */
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
  const mapsQuery = snapshot.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(snapshot.address)}`
    : null;

  const hasContacts = Boolean(
    snapshot.phone || snapshot.email || mapsQuery || snapshot.paymentLinkUrl
  );
  const hasActions = snapshot.canAssignTechnician || whatsappHref;

  if (!hasContacts && !hasActions) return null;

  return (
    <CaseHubDetailStep
      step={3}
      title={t("caseHub.pipeline.step_act")}
      testId="case-hub-detail-actions"
    >
      <div className="space-y-3">
        {hasContacts ? (
          <div className="flex flex-col gap-2">
            {snapshot.phone ? (
              <a
                href={`tel:${snapshot.phone}`}
                data-testid="case-hub-call-client"
                className={CASE_HUB_DETAIL.contactRow}
              >
                <Phone className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                <span className="truncate">{snapshot.phone}</span>
              </a>
            ) : null}
            {snapshot.email ? (
              <a
                href={`mailto:${snapshot.email}`}
                data-testid="case-hub-email-client"
                className={CASE_HUB_DETAIL.contactRow}
              >
                <Mail className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                <span className="truncate">{snapshot.email}</span>
              </a>
            ) : null}
            {mapsQuery ? (
              <a
                href={mapsQuery}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="case-hub-open-map"
                className={CASE_HUB_DETAIL.contactRow}
              >
                <MapPin className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                <span className="truncate">{snapshot.address ?? t("caseHub.right.open_map")}</span>
                <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-slate-400" aria-hidden />
              </a>
            ) : null}
            {snapshot.paymentLinkUrl ? (
              <a
                href={snapshot.paymentLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="case-hub-payment-link"
                className={cn(
                  CASE_HUB_DETAIL.contactRow,
                  "bg-slate-900 text-white hover:bg-slate-800"
                )}
              >
                <span className="truncate">{t("caseHub.right.payment_link")}</span>
                <ExternalLink className="ml-auto h-3 w-3 shrink-0 opacity-80" aria-hidden />
              </a>
            ) : null}
          </div>
        ) : null}

        {hasActions ? (
          <div
            className={cn(
              "flex flex-col gap-2",
              hasContacts && "border-t border-slate-100/90 pt-3"
            )}
          >
            {snapshot.canAssignTechnician ? (
              assignOpen ? (
                <TechnicianAssignPicker
                  className="max-h-[320px] min-h-0 overflow-hidden rounded-[16px] bg-slate-50 ring-1 ring-inset ring-slate-100"
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
                  className={CASE_HUB_DETAIL.btnPrimary}
                >
                  <UserPlus className="h-4 w-4" aria-hidden />
                  {t("caseHub.actions.assign_technician")}
                </button>
              )
            ) : null}

            {isAssigning ? (
              <div className="flex items-center justify-center gap-2 py-1 text-[12px] text-slate-500">
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
                className={CASE_HUB_DETAIL.btnSecondary}
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden />
                {t("caseHub.actions.whatsapp")} · {snapshot.whatsapp}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </CaseHubDetailStep>
  );
}
