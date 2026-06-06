"use client";

import { UserPlus, CheckCircle2, Clock, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HubActionBar, HubButton, HubCard, HubDetailHeader, HUB_TYPE } from "@/core/ui/hub";
import { useTranslation } from "@/core/i18n/I18nContext";
import { capitalizeName, formatAddress } from "@/utils/stringUtils";
import {
  isInterventionAwaitingTechnicianAcceptance,
  isInterventionInBackofficeRequestsQueue,
  isInterventionPendingBackOfficeIntake,
} from "@/features/interventions/technicianSchedule";
import { canTransitionInterventionStatus } from "@/features/interventions/workflow/interventionWorkflow";
import { devUiPreviewEnabled } from "@/core/config/devUiPreview";
import { PRESENTATION_PRIVACY_MODE } from "@/core/config/presentationMode";
import type { Intervention } from "@/features/interventions/types";
import RequestDetailAudioPlayer from "@/features/backoffice/components/RequestDetailAudioPlayer";
import ScheduleConflictBanner from "@/features/scheduling/components/ScheduleConflictBanner";
import ProposedScheduleSlots from "@/features/scheduling/components/ProposedScheduleSlots";
import TechnicianAssignPicker from "@/features/dispatch/components/TechnicianAssignPicker";
import DuplicateWarningBanner from "@/features/interventions/components/DuplicateWarningBanner";
import type { ScheduleConflict } from "@/features/scheduling/scheduleConflicts";
import type { ProposedSlot } from "@/features/scheduling/proposeAvailableSlots";

function readTranscription(inv: unknown): string | null {
  if (!inv || typeof inv !== "object") return null;
  const anyInv = inv as Record<string, unknown>;
  const candidates = [anyInv.transcription, anyInv.audioTranscription, anyInv.audio_transcription];
  const hit = candidates.find((v) => typeof v === "string" && v.trim().length > 0);
  return typeof hit === "string" ? hit : null;
}

type Props = {
  selectedItem: Intervention;
  interventions: Intervention[];
  cid: string | null;
  pwaV2: boolean;
  // audio
  resolvedAudioUrl: string | null;
  isResolvingAudio: boolean;
  audioStorageResolveFailed: boolean;
  // report completion media
  selectedReportCompletion: { photoUrls: string[]; signatureUrl: string | null };
  // date editing
  isEditingDateTime: boolean;
  setIsEditingDateTime: (v: boolean) => void;
  editDate: string;
  setEditDate: (v: string) => void;
  editTime: string;
  setEditTime: (v: string) => void;
  editScheduleConflicts: ScheduleConflict[];
  intakeProposedSlots: ProposedSlot[];
  intakeSlotsTitleKey: string;
  // assign picker
  assignPickerOpen: boolean;
  setAssignPickerOpen: (v: boolean) => void;
  isAssigning: boolean;
  // handlers
  onClose: () => void;
  onDelete: (id: string) => void;
  onCancelIntervention: (id: string) => void;
  onVerify: (id: string) => void;
  onAssign: (
    id: string,
    technicianUid: string,
    schedule?: { scheduledDate: string; scheduledTime: string }
  ) => void;
  onDownloadQuotePdf: (id: string) => void;
  onUpdateDateTime: () => void;
};

export default function InterventionDetailPanel({
  selectedItem,
  interventions,
  cid,
  pwaV2,
  resolvedAudioUrl,
  isResolvingAudio,
  audioStorageResolveFailed,
  selectedReportCompletion,
  isEditingDateTime,
  setIsEditingDateTime,
  editDate,
  setEditDate,
  editTime,
  setEditTime,
  editScheduleConflicts,
  intakeProposedSlots,
  intakeSlotsTitleKey,
  assignPickerOpen,
  setAssignPickerOpen,
  isAssigning,
  onClose,
  onDelete,
  onCancelIntervention,
  onVerify,
  onAssign,
  onDownloadQuotePdf,
  onUpdateDateTime,
}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      data-testid="backoffice-inbox-detail"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-30 flex min-h-0 flex-col overflow-hidden bg-white rounded-[inherit] shadow-2xl"
    >
      <HubDetailHeader
        title={
          assignPickerOpen
            ? t("dispatch.assign_picker.title")
            : isInterventionInBackofficeRequestsQueue(selectedItem)
              ? isInterventionAwaitingTechnicianAcceptance(selectedItem)
                ? t("backoffice.inbox.detail_title_returned")
                : t("backoffice.inbox.detail_title_request")
              : t("backoffice.inbox.detail_title_report")
        }
        onBack={() => {
          onClose();
          setIsEditingDateTime(false);
          setAssignPickerOpen(false);
        }}
      />

      {/* Detail Content — masqué quand le picker assignation occupe tout l'espace */}
      {!assignPickerOpen ? (
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
                {!isEditingDateTime && (
                  <button
                    onClick={() => {
                      setEditDate(selectedItem.requestedDate || "");
                      setEditTime(selectedItem.requestedTime || "");
                      setIsEditingDateTime(true);
                    }}
                    className="text-[11px] text-blue-600 font-bold hover:underline"
                  >
                    {t("backoffice.inbox.edit").toUpperCase()}
                  </button>
                )}
              </div>

              {isEditingDateTime ? (
                <div className="space-y-2">
                  <ScheduleConflictBanner conflicts={editScheduleConflicts} />
                  <ProposedScheduleSlots
                    titleKey={intakeSlotsTitleKey}
                    dateYmd={
                      editDate.trim() ||
                      selectedItem.requestedDate?.trim() ||
                      new Date().toISOString().slice(0, 10)
                    }
                    onDateChange={(date) => {
                      setEditDate(date);
                      setEditTime("");
                    }}
                    slots={intakeProposedSlots}
                    selectedTime={editTime || null}
                    onSelectTime={setEditTime}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="rounded-[12px] border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="rounded-[12px] border border-slate-200 px-3 py-2 text-sm"
                    />
                    <div className="col-span-2 flex justify-end gap-2 mt-1">
                      <button
                        onClick={() => setIsEditingDateTime(false)}
                        className="text-xs px-3 py-1.5 rounded-[8px] bg-slate-100"
                      >
                        {t("common.cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void onUpdateDateTime()}
                        disabled={editScheduleConflicts.length > 0}
                        className="text-xs px-3 py-1.5 rounded-[8px] bg-slate-900 text-white disabled:opacity-50"
                      >
                        {t("common.save")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-blue-900 font-bold">
                  <Clock className="w-4 h-4" />
                  {selectedItem.requestedDate
                    ? `${selectedItem.requestedDate} ${selectedItem.requestedTime ? `à ${selectedItem.requestedTime}` : ""}`
                    : t("backoffice.inbox.asap")}
                </div>
              )}
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
                          (PRESENTATION_PRIVACY_MODE || devUiPreviewEnabled) &&
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
        </div>
      ) : null}

      <HubActionBar fill={assignPickerOpen}>
        {isInterventionInBackofficeRequestsQueue(selectedItem) ? (
          assignPickerOpen ? (
            <TechnicianAssignPicker
              className="min-h-0 flex-1"
              intervention={selectedItem}
              peerInterventions={interventions}
              isAssigning={isAssigning}
              onCancel={() => setAssignPickerOpen(false)}
              onAssign={(technicianUid, schedule) =>
                onAssign(selectedItem.id, technicianUid, schedule)
              }
            />
          ) : (
            <>
              {canTransitionInterventionStatus(selectedItem.status, "cancelled") ? (
                <HubButton
                  type="button"
                  variant="secondary"
                  data-testid="backoffice-inbox-cancel"
                  onClick={() => void onCancelIntervention(selectedItem.id)}
                >
                  <X className="h-4 w-4" />
                  {t("status.cancelled")}
                </HubButton>
              ) : null}
              <HubButton variant="dangerOutline" onClick={() => onDelete(selectedItem.id)}>
                <Trash2 className="h-4 w-4" />
                {t("common.delete")}
              </HubButton>
              <HubButton
                type="button"
                variant="accent"
                emphasis
                data-testid="backoffice-inbox-assign"
                onClick={() => setAssignPickerOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                {t("backoffice.inbox.confirm_assign")}
              </HubButton>
            </>
          )
        ) : (
          <>
            <HubButton variant="dangerOutline" onClick={() => onDelete(selectedItem.id)}>
              <Trash2 className="h-4 w-4" />
              {t("common.delete")}
            </HubButton>
            <HubButton
              type="button"
              variant="success"
              emphasis
              data-testid="backoffice-inbox-verify-report"
              disabled={selectedItem.status === "invoiced"}
              onClick={() => onVerify(selectedItem.id)}
              className={cn(
                selectedItem.status === "invoiced" &&
                  "cursor-not-allowed bg-slate-100 text-slate-400 shadow-none hover:bg-slate-100"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              {selectedItem.status === "invoiced"
                ? t("backoffice.inbox.report_already_verified")
                : t("backoffice.inbox.verify_report")}
            </HubButton>
          </>
        )}
      </HubActionBar>
    </motion.div>
  );
}
