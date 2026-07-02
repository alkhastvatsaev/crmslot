"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { mapI18nLanguageToLocale } from "@/features/interventions/technicianSchedule";
import type { TrackingPhase } from "@/features/interventions/requesterTrackingSteps";
import {
  getTrackingEtaLabel,
  getTrackingHeadlineKey,
} from "@/features/interventions/requesterTrackingSteps";
import RequesterTrackingProgressBar from "@/features/interventions/components/RequesterTrackingProgressBar";
import RequesterPushNotificationButton from "@/features/interventions/components/RequesterPushNotificationButton";
import RequesterPaymentPanel from "@/features/interventions/components/RequesterPaymentPanel";
import ClientRatingPanel from "@/features/interventions/components/ClientRatingPanel";

type InterventionSnapshot = {
  id: string;
  status?: string;
  title?: string;
  problem?: string;
  invoicePdfUrl?: string;
  paymentStatus?: string | null;
  invoiceAmountCents?: number | null;
  stripePaymentLinkUrl?: string | null;
  clientRating?: number | null;
  clientComment?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  requestedDate?: string | null;
  requestedTime?: string | null;
};

type Props = {
  phase: TrackingPhase;
  intervention: InterventionSnapshot | null;
  draftTitle: string;
  status: string;
  hasIntervention: boolean;
  displayName: string;
  caseTitle?: string | null;
  showBackToList: boolean;
  onBackToList: () => void;
};

const springTransition = { type: "spring", bounce: 0, duration: 0.45 } as const;

export default function RequesterTrackingStepScreen({
  phase,
  intervention,
  draftTitle,
  status,
  hasIntervention,
  displayName,
  caseTitle,
  showBackToList,
  onBackToList,
}: Props) {
  const { t, language } = useTranslation();
  const headlineKey = getTrackingHeadlineKey(status, hasIntervention);
  const headline = String(t(headlineKey as never) || t(`tracking.headline.pending` as never));

  const etaLabel =
    phase.showEta && intervention
      ? getTrackingEtaLabel(intervention, mapI18nLanguageToLocale(language), t)
      : null;

  const showCompletionExtras =
    phase.showCompletionExtras &&
    intervention &&
    (intervention.status === "invoiced" || intervention.status === "done");

  const needsPayment =
    showCompletionExtras &&
    intervention.paymentStatus !== "paid" &&
    (intervention.stripePaymentLinkUrl || typeof intervention.invoiceAmountCents === "number");

  return (
    <motion.div
      key={`${phase.id}-${status}`}
      data-testid="tracking-step-screen"
      data-tracking-phase={phase.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-2 pt-2"
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden text-center">
        {showBackToList ? (
          <button
            type="button"
            onClick={onBackToList}
            className="mb-3 flex shrink-0 items-center gap-1 self-start text-[12px] font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
            {(t("tracking.all_cases") as string) || "Mes dossiers"}
          </button>
        ) : null}

        <div className="mb-5 w-full max-w-[280px] shrink-0">
          <p className="truncate text-[13px] font-medium text-slate-500">{displayName}</p>
          {caseTitle ? (
            <p className="mt-0.5 truncate text-[12px] text-slate-400">{caseTitle}</p>
          ) : null}
        </div>

        <h2
          data-testid="tracking-headline"
          className="max-w-[280px] text-[20px] font-semibold leading-snug tracking-[-0.02em] text-slate-900"
        >
          {headline}
        </h2>

        {!hasIntervention && draftTitle && !caseTitle ? (
          <p className="mt-2 line-clamp-2 max-w-[260px] text-[13px] text-slate-500">{draftTitle}</p>
        ) : null}

        {etaLabel ? (
          <p data-testid="tracking-eta" className="mt-2 text-[13px] font-medium text-slate-500">
            {etaLabel}
          </p>
        ) : null}

        {status === "waiting_material" ? (
          <p
            data-testid="tracking-waiting-material-subline"
            className="mt-2 text-[13px] text-slate-500"
          >
            {t("tracking.waiting_material_subline")}
          </p>
        ) : null}

        {phase.id === "received" && hasIntervention && status === "pending" ? (
          <div data-testid="tracking-push-prompt" className="mt-4 w-full max-w-[280px] shrink-0">
            <p className="mb-2 text-[12px] leading-relaxed text-slate-500">
              {String(t("requester.ux.tracking_push_prompt"))}
            </p>
            <RequesterPushNotificationButton />
          </div>
        ) : null}

        {showCompletionExtras ? (
          <div
            data-testid="tracking-completion-strip"
            className="mt-5 flex w-full max-w-[260px] shrink-0 flex-col items-stretch gap-2.5"
          >
            {intervention.invoicePdfUrl ? (
              <a
                href={intervention.invoicePdfUrl}
                target="_blank"
                rel="noreferrer"
                data-testid="requester-invoice-download"
                className="self-center text-[13px] font-medium text-slate-600 underline-offset-4 transition-colors hover:text-slate-900 hover:underline"
              >
                {t("payment.download_invoice")}
              </a>
            ) : null}
            {needsPayment ? (
              <RequesterPaymentPanel
                interventionId={intervention.id}
                paymentStatus={intervention.paymentStatus}
                invoiceAmountCents={intervention.invoiceAmountCents}
                stripePaymentLinkUrl={intervention.stripePaymentLinkUrl}
                compact
                premium
                unified
              />
            ) : intervention.paymentStatus === "paid" ? (
              <RequesterPaymentPanel
                interventionId={intervention.id}
                paymentStatus={intervention.paymentStatus}
                invoiceAmountCents={intervention.invoiceAmountCents}
                stripePaymentLinkUrl={intervention.stripePaymentLinkUrl}
                compact
                premium
                unified
              />
            ) : null}
            <ClientRatingPanel
              interventionId={intervention.id}
              existingRating={intervention.clientRating}
              existingComment={intervention.clientComment}
              compact
              premium
              unified
            />
          </div>
        ) : null}

        <RequesterTrackingProgressBar progressIndex={phase.progressIndex} />
      </div>
    </motion.div>
  );
}
