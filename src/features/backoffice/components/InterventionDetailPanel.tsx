"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HubDetailHeader } from "@/core/ui/hub";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  isInterventionAwaitingTechnicianAcceptance,
  isInterventionInBackofficeRequestsQueue,
} from "@/features/interventions/technicianSchedule";
import { canArchiveBackofficeReportInInbox } from "@/features/backoffice/backofficeReportsInboxArchive";
import type { Intervention } from "@/features/interventions/types";
import type { ScheduleConflict } from "@/features/scheduling/scheduleConflicts";
import type { ProposedSlot } from "@/features/scheduling/proposeAvailableSlots";
import InterventionDetailScrollBody from "@/features/backoffice/components/InterventionDetailScrollBody";
import InterventionDetailActionBar from "@/features/backoffice/components/InterventionDetailActionBar";

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
  onCancelIntervention: (id: string) => void;
  onVerify: (id: string) => void;
  onArchiveReport: (id: string) => void;
  onReject: (id: string, reason?: string) => void | Promise<void>;
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
  onCancelIntervention,
  onVerify,
  onArchiveReport,
  onReject,
  onAssign,
  onDownloadQuotePdf,
  onUpdateDateTime,
}: Props) {
  const { t } = useTranslation();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectBusy, setRejectBusy] = useState(false);
  const scheduleEditorOpen =
    isEditingDateTime && isInterventionInBackofficeRequestsQueue(selectedItem);
  const actionBarFill = assignPickerOpen || scheduleEditorOpen;
  const isReportQueue = !isInterventionInBackofficeRequestsQueue(selectedItem);
  const canRejectReport = isReportQueue && selectedItem.status === "done";
  const canArchiveReport = isReportQueue && canArchiveBackofficeReportInInbox(selectedItem);

  const handleRejectConfirm = async () => {
    if (rejectBusy) return;
    setRejectBusy(true);
    try {
      await onReject(selectedItem.id, rejectReason.trim() || undefined);
      setRejectOpen(false);
      setRejectReason("");
    } finally {
      setRejectBusy(false);
    }
  };

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
            : scheduleEditorOpen
              ? t("backoffice.inbox.requested_schedule")
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

      {/* Detail Content — masqué quand picker assignation ou éditeur créneaux occupe l'espace */}
      {!assignPickerOpen && !scheduleEditorOpen ? (
        <InterventionDetailScrollBody
          selectedItem={selectedItem}
          cid={cid}
          pwaV2={pwaV2}
          resolvedAudioUrl={resolvedAudioUrl}
          isResolvingAudio={isResolvingAudio}
          audioStorageResolveFailed={audioStorageResolveFailed}
          selectedReportCompletion={selectedReportCompletion}
          onDownloadQuotePdf={onDownloadQuotePdf}
          canRejectReport={canRejectReport}
          rejectOpen={rejectOpen}
          rejectBusy={rejectBusy}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          setRejectOpen={setRejectOpen}
          onRejectConfirm={handleRejectConfirm}
        />
      ) : null}

      <InterventionDetailActionBar
        selectedItem={selectedItem}
        interventions={interventions}
        assignPickerOpen={assignPickerOpen}
        scheduleEditorOpen={scheduleEditorOpen}
        actionBarFill={actionBarFill}
        isAssigning={isAssigning}
        editScheduleConflicts={editScheduleConflicts}
        intakeProposedSlots={intakeProposedSlots}
        intakeSlotsTitleKey={intakeSlotsTitleKey}
        editDate={editDate}
        setEditDate={setEditDate}
        editTime={editTime}
        setEditTime={setEditTime}
        setAssignPickerOpen={setAssignPickerOpen}
        setIsEditingDateTime={setIsEditingDateTime}
        rejectOpen={rejectOpen}
        setRejectOpen={setRejectOpen}
        canRejectReport={canRejectReport}
        canArchiveReport={canArchiveReport}
        onAssign={onAssign}
        onUpdateDateTime={onUpdateDateTime}
        onVerify={onVerify}
        onArchiveReport={onArchiveReport}
      />
    </motion.div>
  );
}
