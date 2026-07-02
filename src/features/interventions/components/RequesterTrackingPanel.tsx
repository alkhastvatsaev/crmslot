"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useRequesterHub } from "@/context/RequesterHubContext";
import { motion } from "framer-motion";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useRequestMobileHubRail } from "@/features/dashboard/MobileHubRailContext";
import { capitalizeName } from "@/utils/stringUtils";
import RequesterTrackingStepScreen from "@/features/interventions/components/RequesterTrackingStepScreen";
import RequesterTrackingCaseGrid from "@/features/interventions/components/RequesterTrackingCaseGrid";
import { resolveTrackingPhase } from "@/features/interventions/requesterTrackingSteps";
import { scheduleEffectUpdate } from "@/utils/scheduleEffectUpdate";
import { useClientPortalInterventions } from "@/features/interventions/hooks/useClientPortalInterventions";
import RequesterPortalAccessUnlock from "@/features/interventions/components/RequesterPortalAccessUnlock";

type TrackedIntervention = {
  id: string;
  status?: string;
  title?: string;
  problem?: string;
  address?: string;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  requestedDate?: string | null;
  requestedTime?: string | null;
  createdAt?: string;
  clientFirstName?: string;
  clientLastName?: string;
  clientCompanyName?: string;
  clientPhone?: string;
  clientEmail?: string | null;
  invoicePdfUrl?: string;
  paymentStatus?: string | null;
  invoiceAmountCents?: number | null;
  stripePaymentLinkUrl?: string | null;
  clientRating?: number | null;
  clientComment?: string | null;
};

const STATUS_PILL: Record<string, string> = {
  pending: "bg-slate-100 text-slate-500",
  pending_needs_address: "bg-amber-100 text-amber-700",
  assigned: "bg-blue-100 text-blue-700",
  en_route: "bg-indigo-100 text-indigo-700",
  on_site: "bg-violet-100 text-violet-700",
  in_progress: "bg-purple-100 text-purple-700",
  waiting_material: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
  invoiced: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function RequesterTrackingPanel() {
  const {
    isSubmitting,
    requestData,
    lastSubmittedRequest,
    lastSubmittedInterventionId,
    lastSubmittedPortalAccessCode,
    profile,
    pendingTrackingInterventionId,
    setPendingTrackingInterventionId,
    portalAccessSession,
    resetRequestOnly,
    setLastSubmittedPortalAccessCode,
  } = useRequesterHub();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { t } = useTranslation();
  const requestMobileHubRail = useRequestMobileHubRail();

  const {
    interventions,
    loading: interventionLoading,
    requiresLogin,
    canLoadCases,
  } = useClientPortalInterventions<TrackedIntervention>({
    profile,
    portalAccessCases: portalAccessSession?.interventions ?? [],
  });

  const latestIntervention = interventions[0] ?? null;
  const resolvedSelectedId = pendingTrackingInterventionId ?? selectedId;
  const selectedIntervention = resolvedSelectedId
    ? (interventions.find((i) => i.id === resolvedSelectedId) ?? latestIntervention)
    : latestIntervention;

  useEffect(() => {
    if (!pendingTrackingInterventionId) return;
    scheduleEffectUpdate(() => {
      setSelectedId(pendingTrackingInterventionId);
      setPendingTrackingInterventionId(null);
    });
  }, [pendingTrackingInterventionId, setPendingTrackingInterventionId]);

  const draftTitle =
    (requestData.problemLabel ?? "").trim() || (requestData.description ?? "").trim();
  const hasDraft = Boolean(draftTitle || (requestData.interventionAddress ?? "").trim());
  const isComposingNewRequest =
    hasDraft && !selectedId && !pendingTrackingInterventionId && !isSubmitting;

  useEffect(() => {
    if (!lastSubmittedInterventionId || isComposingNewRequest) return;
    setSelectedId((prev) => prev ?? lastSubmittedInterventionId);
  }, [lastSubmittedInterventionId, isComposingNewRequest]);

  const pinnedIntervention =
    lastSubmittedInterventionId &&
    interventions.find((row) => row.id === lastSubmittedInterventionId);

  const hasSubmitted = Boolean(
    (!isComposingNewRequest && latestIntervention) ||
    (!isComposingNewRequest && pinnedIntervention) ||
    (!isComposingNewRequest && lastSubmittedRequest)
  );

  const hasPortalTracking = Boolean(portalAccessSession?.interventions.length);
  const hasAuthenticatedTracking =
    !requiresLogin && canLoadCases && (interventions.length > 0 || hasSubmitted);
  const showTrackingView =
    hasDraft || isSubmitting || hasPortalTracking || hasAuthenticatedTracking;

  const showList =
    interventions.length > 1 &&
    !selectedId &&
    !resolvedSelectedId &&
    !isComposingNewRequest &&
    !lastSubmittedInterventionId;

  const trackedIntervention = isComposingNewRequest ? null : selectedIntervention;

  const status = isComposingNewRequest
    ? "draft"
    : trackedIntervention?.status ||
      (lastSubmittedRequest && !isComposingNewRequest ? "pending" : "draft");

  const hasIntervention = Boolean(trackedIntervention) && !isComposingNewRequest;

  const trackingPhase = useMemo(
    () =>
      resolveTrackingPhase({
        hasIntervention,
        hasDraft,
        isSubmitting,
        status,
      }),
    [hasIntervention, hasDraft, isSubmitting, status]
  );

  const getDisplayName = (iv?: TrackedIntervention | null) => {
    const src = iv ?? trackedIntervention;
    if (src) {
      if (src.clientCompanyName) return src.clientCompanyName;
      const first = src.clientFirstName || "";
      const last = src.clientLastName || "";
      if (first || last) return `${capitalizeName(first)} ${capitalizeName(last)}`.trim();
    }
    if (profile?.companyName) return profile.companyName;
    const first = profile?.firstName || "";
    const last = profile?.lastName || "";
    if (first || last) return `${capitalizeName(first)} ${capitalizeName(last)}`.trim();
    return String(t("tracking.client_loading"));
  };

  const formatShortDate = (val?: string) => {
    if (!val) return "";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("fr-BE", { day: "2-digit", month: "short" });
  };

  const showNewRequestButton =
    showTrackingView && !isComposingNewRequest && (hasIntervention || hasSubmitted);

  const handleNewRequest = () => {
    resetRequestOnly();
    setSelectedId(null);
    setLastSubmittedPortalAccessCode(null);
    requestMobileHubRail("center");
  };

  return (
    <div
      data-testid="requester-tracking-panel"
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-transparent font-brand"
    >
      {showTrackingView ? (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {interventionLoading &&
          interventions.length === 0 &&
          !isSubmitting &&
          !hasDraft &&
          !hasPortalTracking ? (
            <div className="flex flex-1 items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-black"
              />
            </div>
          ) : showList ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <RequesterTrackingCaseGrid
                cases={interventions.map((iv) => {
                  const statusKey = iv.status ?? "pending";
                  return {
                    id: iv.id,
                    title: iv.title || iv.problem || getDisplayName(iv),
                    lastName: iv.clientLastName
                      ? capitalizeName(iv.clientLastName)
                      : iv.clientCompanyName
                        ? capitalizeName(iv.clientCompanyName)
                        : undefined,
                    statusKey,
                    statusLabel: (t(`status.${statusKey}`) as string) || statusKey,
                    dateLabel: formatShortDate(iv.createdAt),
                    statusPillClassName: STATUS_PILL[statusKey] ?? "bg-slate-100 text-slate-500",
                  };
                })}
                onSelect={setSelectedId}
              />
            </div>
          ) : (
            <div
              data-testid="tracking-one-page"
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <RequesterTrackingStepScreen
                phase={trackingPhase}
                intervention={trackedIntervention}
                draftTitle={draftTitle}
                status={status}
                hasIntervention={hasIntervention}
                displayName={getDisplayName()}
                caseTitle={
                  isComposingNewRequest
                    ? draftTitle || null
                    : (trackedIntervention?.title ?? trackedIntervention?.problem ?? null)
                }
                showBackToList={interventions.length > 1 && !isComposingNewRequest}
                onBackToList={() => setSelectedId(null)}
              />
            </div>
          )}
          {showNewRequestButton ? (
            <button
              type="button"
              data-testid="requester-new-request-btn"
              onClick={handleNewRequest}
              className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-blue-500 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-600 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
              {String(t("requester.ux.new_request"))}
            </button>
          ) : null}
        </div>
      ) : (
        <RequesterPortalAccessUnlock suggestedDossierNumber={lastSubmittedPortalAccessCode} />
      )}
    </div>
  );
}
