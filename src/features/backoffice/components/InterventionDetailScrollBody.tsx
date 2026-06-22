"use client";

import { Clock } from "lucide-react";
import EquipmentPanel from "@/features/equipment/components/EquipmentPanel";
import { cn } from "@/lib/utils";
import { HubCard, HUB_TYPE } from "@/core/ui/hub";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useTechnicians } from "@/features/technicians/hooks";
import { hasPendingTechnicianReportAmendment } from "@/features/interventions/technicianInvoicedReportAmend";
import { capitalizeName, formatAddress } from "@/utils/stringUtils";
import {
  isInterventionAwaitingTechnicianAcceptance,
  isInterventionInBackofficeRequestsQueue,
  isInterventionPendingBackOfficeIntake,
} from "@/features/interventions/technicianSchedule";
import { PRESENTATION_PRIVACY_MODE } from "@/core/config/presentationMode";
import type { Intervention } from "@/features/interventions/types";
import RequestDetailAudioPlayer from "@/features/backoffice/components/RequestDetailAudioPlayer";
import DuplicateWarningBanner from "@/features/interventions/components/DuplicateWarningBanner";
import InterventionInvoicePreviewCard from "@/features/billing/components/InterventionInvoicePreviewCard";
import { invoicePreviewFromIntervention } from "@/features/billing/invoicePreviewFromIntervention";
import { readTranscription } from "@/features/backoffice/components/interventionDetailHelpers";
import InterventionDetailRejectForm from "@/features/backoffice/components/InterventionDetailRejectForm";

type Props = {
  selectedItem: Intervention;
  cid: string | null;
  pwaV2: boolean;
  resolvedAudioUrl: string | null;
  isResolvingAudio: boolean;
  audioStorageResolveFailed: boolean;
  selectedReportCompletion: { photoUrls: string[]; signatureUrl: string | null };
  onDownloadQuotePdf: (id: string) => void;
  canRejectReport: boolean;
  rejectOpen: boolean;
  rejectBusy: boolean;
  rejectReason: string;
  setRejectReason: (value: string) => void;
  setRejectOpen: (open: boolean) => void;
  onRejectConfirm: () => void | Promise<void>;
};

export default function InterventionDetailScrollBody({
  selectedItem,
  cid,
  pwaV2,
  resolvedAudioUrl,
  isResolvingAudio,
  audioStorageResolveFailed,
  selectedReportCompletion,
  onDownloadQuotePdf,
  canRejectReport,
  rejectOpen,
  rejectBusy,
  rejectReason,
  setRejectReason,
  setRejectOpen,
  onRejectConfirm,
}: Props) {
  const { t } = useTranslation();
  const { technicians } = useTechnicians();
  const amendedByUid = (selectedItem.technicianReportAmendedByUid ?? "").trim();
  const amendedByTech = technicians.find(
    (tech) => tech.id === amendedByUid || tech.authUid === amendedByUid
  );
  const amendedByName =
    [amendedByTech?.firstName, amendedByTech?.lastName].filter(Boolean).join(" ").trim() ||
    amendedByTech?.name?.trim() ||
    amendedByUid;
  const showTechnicianAmendmentAlert =
    hasPendingTechnicianReportAmendment(selectedItem) &&
    !isInterventionInBackofficeRequestsQueue(selectedItem);

  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6 space-y-8">
      {/* Header Info */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
              isInterventionAwaitingTechnicianAcceptance(selectedItem)
                ? "bg-slate-200 text-slate-700"
                : isInterventionPendingBackOfficeIntake(selectedItem)
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
            )}
          >
            {isInterventionAwaitingTechnicianAcceptance(selectedItem)
              ? t("backoffice.inbox.kind_returned")
              : isInterventionPendingBackOfficeIntake(selectedItem)
                ? t("backoffice.inbox.kind_request")
                : t("backoffice.inbox.kind_report")}{" "}
            • ID: {selectedItem.id.slice(-6).toUpperCase()}
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 leading-tight">
          {capitalizeName(
            selectedItem.clientLastName ||
              selectedItem.clientName ||
              t("backoffice.inbox.anonymous_client")
          )}
        </h2>
        <p className="text-[15px] font-medium text-slate-500 mt-1">
          {selectedItem.clientPhone || t("backoffice.inbox.no_phone")}
        </p>
        {selectedItem.clientEmail && (
          <p className="text-[14px] font-medium text-slate-500 mt-0.5 break-all">
            <a href={`mailto:${selectedItem.clientEmail}`} className="hover:underline">
              {selectedItem.clientEmail}
            </a>
          </p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-1">
        <span className={HUB_TYPE.eyebrow}>{t("backoffice.inbox.location")}</span>
        <p className="text-[15px] font-semibold text-slate-800">
          {formatAddress(selectedItem.address)}
        </p>
      </div>

      {/* Problem / Report Description */}
      <div className="space-y-2">
        <span className={HUB_TYPE.eyebrow}>
          {isInterventionInBackofficeRequestsQueue(selectedItem)
            ? t("backoffice.inbox.problem_label")
            : t("backoffice.inbox.report_label")}
        </span>
        <HubCard tone="muted" padding="md">
          <p className="text-[15px] text-slate-800 leading-relaxed">
            {selectedItem.problem || t("backoffice.inbox.no_description_provided")}
          </p>
        </HubCard>
      </div>

      {cid && selectedItem.address && (selectedItem.problem || selectedItem.title) && (
        <DuplicateWarningBanner
          interventionId={selectedItem.id}
          address={selectedItem.address}
          problem={selectedItem.problem ?? selectedItem.title ?? ""}
          companyId={cid}
          client={{
            firstName: selectedItem.clientFirstName ?? undefined,
            lastName: selectedItem.clientLastName ?? undefined,
            phone: selectedItem.clientPhone ?? selectedItem.phone ?? undefined,
            email: selectedItem.clientEmail ?? undefined,
          }}
        />
      )}

      {pwaV2 ? (
        <button
          type="button"
          data-testid="backoffice-download-quote-pdf"
          onClick={() => onDownloadQuotePdf(selectedItem.id)}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
        >
          {t("quote_pdf.download")}
        </button>
      ) : null}

      {/* Date & Time management for requests */}
      {isInterventionInBackofficeRequestsQueue(selectedItem) && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {t("backoffice.inbox.requested_schedule")}
            </span>
          </div>

          <div className="flex items-center gap-2 text-blue-900 font-bold">
            <Clock className="w-4 h-4" />
            {selectedItem.requestedDate
              ? `${selectedItem.requestedDate} ${selectedItem.requestedTime ? `à ${selectedItem.requestedTime}` : ""}`
              : t("backoffice.inbox.asap")}
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {((isInterventionInBackofficeRequestsQueue(selectedItem) &&
        selectedItem.attachmentThumbnails) ||
        (!isInterventionInBackofficeRequestsQueue(selectedItem) &&
          selectedReportCompletion.photoUrls.length > 0)) && (
        <div className="space-y-3" data-testid="backoffice-report-detail-photos-section">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {isInterventionInBackofficeRequestsQueue(selectedItem)
              ? t("backoffice.inbox.photos_client")
              : t("backoffice.inbox.photos_completion")}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(isInterventionInBackofficeRequestsQueue(selectedItem)
              ? selectedItem.attachmentThumbnails
              : selectedReportCompletion.photoUrls
            )?.map((url, i) => (
              <div
                key={i}
                className="aspect-square relative rounded-[16px] overflow-hidden border border-slate-100 bg-slate-50 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Intervention"
                  className={cn(
                    "w-full h-full object-cover",
                    !isInterventionInBackofficeRequestsQueue(selectedItem) &&
                      PRESENTATION_PRIVACY_MODE &&
                      "blur-lg"
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio / Transcription for requests */}
      {isInterventionInBackofficeRequestsQueue(selectedItem) ? (
        <div className="space-y-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {t("backoffice.inbox.voice_message")}
          </span>
          {resolvedAudioUrl ? (
            <RequestDetailAudioPlayer
              key={`${selectedItem.id}-${resolvedAudioUrl}`}
              url={resolvedAudioUrl}
            />
          ) : isResolvingAudio ? (
            <div
              data-testid="backoffice-request-detail-audio-loading"
              className="flex w-full items-center gap-3 rounded-[16px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4"
              aria-busy="true"
              aria-label={t("backoffice.inbox.voice_loading")}
            >
              <div
                className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200"
                aria-hidden
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <div className="h-2 w-full animate-pulse rounded-full bg-slate-200" />
                <div className="flex justify-between gap-2">
                  <div className="h-2 w-10 animate-pulse rounded bg-slate-200" />
                  <div className="h-2 w-10 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
              <div
                className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200/80"
                aria-hidden
              />
            </div>
          ) : audioStorageResolveFailed ? (
            <div
              data-testid="backoffice-request-detail-audio-storage-error"
              className="w-full rounded-[16px] border border-amber-200/90 bg-amber-50/80 px-4 py-4 text-center text-[13px] font-semibold leading-snug text-amber-950"
            >
              {t("backoffice.inbox.voice_storage_error")}
            </div>
          ) : (
            <div
              data-testid="backoffice-request-detail-audio-empty"
              className="w-full rounded-[16px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-center text-[13px] font-semibold text-slate-500"
            >
              {t("backoffice.inbox.voice_empty")}
            </div>
          )}
          {readTranscription(selectedItem) ? (
            <div className="rounded-[16px] border border-blue-100 bg-blue-50/50 p-4 text-sm italic text-blue-900">
              &quot;{readTranscription(selectedItem)}&quot;
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Equipment inventory for this client */}
      {selectedItem.clientId ? (
        <div className="space-y-1" data-testid="backoffice-equipment-section">
          <EquipmentPanel clientId={selectedItem.clientId} />
        </div>
      ) : null}

      {/* Signature for reports */}
      {!isInterventionInBackofficeRequestsQueue(selectedItem) &&
        selectedReportCompletion.signatureUrl && (
          <div className="space-y-3" data-testid="backoffice-report-detail-signature-section">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {t("backoffice.inbox.signature_client")}
            </span>
            <div className="rounded-[16px] bg-slate-50 p-4 border border-slate-100 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedReportCompletion.signatureUrl}
                alt={t("backoffice.inbox.signature_alt")}
                className="max-h-32 object-contain"
              />
            </div>
          </div>
        )}

      {/* Facture proposée par le technicien — vérification avant validation */}
      {!isInterventionInBackofficeRequestsQueue(selectedItem) ? (
        <InterventionInvoicePreviewCard {...invoicePreviewFromIntervention(selectedItem)} />
      ) : null}

      {showTechnicianAmendmentAlert ? (
        <div
          data-testid="backoffice-technician-amendment-alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <p className="text-[12px] font-bold text-amber-900">
            {String(t("backoffice.inbox.technician_amendment_alert_title"))}
          </p>
          <p className="mt-1 text-[13px] leading-snug text-amber-950">
            {String(t("backoffice.inbox.technician_amendment_alert_body")).replace(
              "{{name}}",
              amendedByName || String(t("backoffice.inbox.unknown_technician"))
            )}
          </p>
        </div>
      ) : null}

      {selectedItem.invoiceReviewRequestedAt ? (
        <div
          data-testid="backoffice-invoice-review-alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-1"
        >
          <p className="text-[12px] font-bold text-amber-900">
            {t("backoffice.inbox.invoice_review_alert_title")}
          </p>
          {selectedItem.invoiceReviewNote ? (
            <p className="text-[13px] leading-snug text-amber-950">
              {selectedItem.invoiceReviewNote}
            </p>
          ) : null}
        </div>
      ) : null}

      {canRejectReport && rejectOpen ? (
        <InterventionDetailRejectForm
          rejectBusy={rejectBusy}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          setRejectOpen={setRejectOpen}
          onConfirm={onRejectConfirm}
        />
      ) : null}
    </div>
  );
}
