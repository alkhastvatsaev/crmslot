"use client";

import { UserPlus, CheckCircle2, Pencil, RotateCcw, Archive, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import { HubActionBar, HubButton } from "@/core/ui/hub";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  isInterventionAwaitingTechnicianAcceptance,
  isInterventionInBackofficeRequestsQueue,
} from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions";
import ScheduleConflictBanner from "@/features/scheduling/components/ScheduleConflictBanner";
import ProposedScheduleSlots from "@/features/scheduling/components/ProposedScheduleSlots";
import TechnicianAssignPicker from "@/features/dispatch/components/TechnicianAssignPicker";
import type { ScheduleConflict } from "@/features/scheduling";
import type { ProposedSlot } from "@/features/scheduling";

type Props = {
  selectedItem: Intervention;
  interventions: Intervention[];
  assignPickerOpen: boolean;
  scheduleEditorOpen: boolean;
  actionBarFill: boolean;
  isAssigning: boolean;
  editScheduleConflicts: ScheduleConflict[];
  intakeProposedSlots: ProposedSlot[];
  intakeSlotsTitleKey: string;
  editDate: string;
  setEditDate: (v: string) => void;
  editTime: string;
  setEditTime: (v: string) => void;
  setAssignPickerOpen: (v: boolean) => void;
  setIsEditingDateTime: (v: boolean) => void;
  rejectOpen: boolean;
  setRejectOpen: (open: boolean) => void;
  canRejectReport: boolean;
  canArchiveReport: boolean;
  onAssign: (
    id: string,
    technicianUid: string,
    schedule?: { scheduledDate: string; scheduledTime: string }
  ) => void;
  onUpdateDateTime: () => void;
  onVerify: (id: string) => void;
  onArchiveReport: (id: string) => void;
};

export default function InterventionDetailActionBar({
  selectedItem,
  interventions,
  assignPickerOpen,
  scheduleEditorOpen,
  actionBarFill,
  isAssigning,
  editScheduleConflicts,
  intakeProposedSlots,
  intakeSlotsTitleKey,
  editDate,
  setEditDate,
  editTime,
  setEditTime,
  setAssignPickerOpen,
  setIsEditingDateTime,
  rejectOpen,
  setRejectOpen,
  canRejectReport,
  canArchiveReport,
  onAssign,
  onUpdateDateTime,
  onVerify,
  onArchiveReport,
}: Props) {
  const { t } = useTranslation();
  const isAwaitingTechnician = isInterventionAwaitingTechnicianAcceptance(selectedItem);

  return (
    <HubActionBar fill={actionBarFill}>
      {isInterventionInBackofficeRequestsQueue(selectedItem) ? (
        assignPickerOpen ? (
          <TechnicianAssignPicker
            className="min-h-0 flex-1"
            intervention={selectedItem}
            peerInterventions={interventions}
            isAssigning={isAssigning}
            techniciansOnly
            onCancel={() => setAssignPickerOpen(false)}
            onAssign={(technicianUid, schedule) =>
              onAssign(selectedItem.id, technicianUid, schedule)
            }
          />
        ) : scheduleEditorOpen ? (
          <div
            data-testid="backoffice-inbox-schedule-editor"
            className="flex min-h-0 flex-1 flex-col gap-3"
          >
            <ScheduleConflictBanner conflicts={editScheduleConflicts} />
            <ProposedScheduleSlots
              className="min-h-0 flex-1 border-0 p-0 shadow-none"
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
            <div className="mt-auto flex gap-3 pt-2">
              <HubButton
                type="button"
                variant="secondary"
                className="flex-1"
                data-testid="backoffice-inbox-schedule-cancel"
                onClick={() => setIsEditingDateTime(false)}
              >
                {t("common.cancel")}
              </HubButton>
              <HubButton
                type="button"
                variant="accent"
                emphasis
                className="flex-1"
                data-testid="backoffice-inbox-schedule-save"
                disabled={editScheduleConflicts.length > 0}
                onClick={() => void onUpdateDateTime()}
              >
                {t("common.save")}
              </HubButton>
            </div>
          </div>
        ) : (
          <>
            <HubButton
              type="button"
              variant="secondary"
              data-testid="backoffice-inbox-edit"
              onClick={() => {
                setAssignPickerOpen(false);
                setEditDate(selectedItem.requestedDate || "");
                setEditTime(selectedItem.requestedTime || "");
                setIsEditingDateTime(true);
              }}
            >
              <Pencil className="h-4 w-4" />
              {t("backoffice.inbox.edit")}
            </HubButton>
            <HubButton
              type="button"
              variant="accent"
              emphasis
              data-testid="backoffice-inbox-assign"
              onClick={() => {
                setIsEditingDateTime(false);
                setAssignPickerOpen(true);
              }}
            >
              <UserPlus className="h-4 w-4" />
              {t("backoffice.inbox.confirm_assign")}
            </HubButton>
          </>
        )
      ) : isAwaitingTechnician ? (
        <div
          data-testid="backoffice-inbox-awaiting-technician"
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[16px] border border-amber-200 bg-amber-50 px-4 text-center text-[13px] font-semibold text-amber-800"
        >
          <Hourglass className="h-4 w-4 shrink-0" aria-hidden />
          {t("backoffice.inbox.awaiting_technician_response")}
        </div>
      ) : (
        <>
          {canRejectReport && !rejectOpen ? (
            <HubButton
              type="button"
              data-testid="backoffice-inbox-reject-report"
              onClick={() => setRejectOpen(true)}
            >
              <RotateCcw className="h-4 w-4" />
              {t("backoffice.inbox.reject_report")}
            </HubButton>
          ) : null}
          <HubButton
            type="button"
            variant="success"
            emphasis
            data-testid="backoffice-inbox-verify-report"
            disabled={selectedItem.status === "invoiced" || rejectOpen}
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
          {canArchiveReport && !rejectOpen ? (
            <HubButton
              type="button"
              variant="secondary"
              data-testid="backoffice-inbox-archive-report"
              onClick={() => void onArchiveReport(selectedItem.id)}
              aria-label={t("backoffice.inbox.archive_report_aria")}
            >
              <Archive className="h-4 w-4" />
              {t("backoffice.inbox.archive_report")}
            </HubButton>
          ) : null}
        </>
      )}
    </HubActionBar>
  );
}
