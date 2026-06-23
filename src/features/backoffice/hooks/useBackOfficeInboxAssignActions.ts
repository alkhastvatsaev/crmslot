"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { auth, firestore } from "@/core/config/firebase";
import { assignInterventionFromBackoffice } from "@/features/backoffice/assignInterventionFromBackoffice";
import type { BackOfficeInboxActionsArgs } from "@/features/backoffice/backOfficeInboxActionsTypes";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import { dispatcherTransitionActor } from "@/features/interventions/workflow/workflowActor";
import { updateInterventionSchedule } from "@/features/scheduling/updateInterventionSchedule";

type Args = Pick<
  BackOfficeInboxActionsArgs,
  | "interventions"
  | "selectedItem"
  | "dragBoardTechUid"
  | "dragBoardDate"
  | "editDate"
  | "editTime"
  | "setSelectedItemId"
  | "setAssignPickerOpen"
  | "setIsAssigning"
  | "setIsEditingDateTime"
  | "t"
>;

export function useBackOfficeInboxAssignActions({
  interventions,
  selectedItem,
  dragBoardTechUid,
  dragBoardDate,
  editDate,
  editTime,
  setSelectedItemId,
  setAssignPickerOpen,
  setIsAssigning,
  setIsEditingDateTime,
  t,
}: Args) {
  const handleAssignToTechnician = useCallback(
    async (
      id: string,
      technicianUid: string,
      schedule?: { scheduledDate: string; scheduledTime: string }
    ) => {
      if (!firestore) return;
      setIsAssigning(true);
      try {
        const row = interventions.find((x) => x.id === id);
        if (id.startsWith("demo-")) {
          toast.success(t("backoffice.toasts.request_assigned"));
          setAssignPickerOpen(false);
          setSelectedItemId(null);
          return;
        }
        if (!row) {
          toast.error(t("common.error"), { description: t("backoffice.toasts.assign_failed") });
          return;
        }
        const assignment = await assignInterventionFromBackoffice(id, row, technicianUid, schedule);
        if (assignment?.rescheduled) {
          const fromSlot =
            `${row.requestedDate ?? row.scheduledDate ?? "?"} ${row.requestedTime ?? row.scheduledTime ?? ""}`.trim();
          toast.success(String(t("backoffice.toasts.request_assigned_rescheduled")), {
            description: String(t("backoffice.toasts.request_assigned_rescheduled_desc"))
              .replace("{{from}}", fromSlot)
              .replace("{{to}}", `${assignment.scheduledDate} ${assignment.scheduledTime}`),
          });
        } else {
          toast.success(t("backoffice.toasts.request_assigned"));
        }
        setAssignPickerOpen(false);
        setSelectedItemId(null);
      } catch (e) {
        const code =
          typeof e === "object" && e !== null && "code" in e
            ? String((e as { code?: string }).code)
            : "";
        const description =
          code === "permission-denied"
            ? t("backoffice.toasts.permission_denied_verify")
            : code === "admin-unavailable"
              ? t("backoffice.toasts.admin_unavailable")
              : e instanceof Error
                ? e.message
                : t("backoffice.toasts.assign_failed");
        toast.error(t("common.error"), { description });
      } finally {
        setIsAssigning(false);
      }
    },
    [interventions, setAssignPickerOpen, setIsAssigning, setSelectedItemId, t]
  );

  const handleCancelIntervention = useCallback(
    async (id: string) => {
      if (!firestore) return;
      const row = interventions.find((x) => x.id === id);
      if (!row) return;
      const actorUid = auth?.currentUser?.uid?.trim();
      if (!actorUid) return;
      try {
        await transitionInterventionStatus({
          db: firestore,
          interventionId: id,
          iv: row,
          toStatus: "cancelled",
          actor: dispatcherTransitionActor(actorUid),
          note: "Annulé depuis le dispatcher",
        });
        toast.success(t("backoffice.toasts.request_cancelled"));
        setSelectedItemId(null);
      } catch {
        toast.error(t("common.error"), { description: t("backoffice.toasts.cancel_failed") });
      }
    },
    [interventions, setSelectedItemId, t]
  );

  const handleDragBoardSchedule = useCallback(
    async (interventionId: string, time: string, technicianUidOverride?: string) => {
      const techUid = (technicianUidOverride ?? dragBoardTechUid).trim();
      if (!techUid) {
        toast.error(String(t("scheduling.drag_board.pick_technician")));
        return;
      }
      const schedule = { scheduledDate: dragBoardDate, scheduledTime: time };
      const row = interventions.find((x) => x.id === interventionId);
      if (!row) return;
      if (row.assignedTechnicianUid?.trim()) {
        if (!firestore) return;
        const actorUid = auth?.currentUser?.uid?.trim() || "system";
        const result = await updateInterventionSchedule({
          db: firestore,
          intervention: row,
          allInterventions: interventions,
          scheduledDate: dragBoardDate,
          scheduledTime: time,
          audit: { actorUid, actorRole: "dispatcher" },
        });
        if (!result.ok) {
          toast.error(
            result.reason === "conflict" ? t("scheduling.conflict.block_save") : t("common.error")
          );
          return;
        }
        toast.success(t("backoffice.toasts.datetime_updated"));
        return;
      }
      await handleAssignToTechnician(interventionId, techUid, schedule);
    },
    [dragBoardDate, dragBoardTechUid, handleAssignToTechnician, interventions, t]
  );

  const handleUpdateDateTime = useCallback(async () => {
    if (!selectedItem || !firestore) return;
    try {
      const actorUid = auth?.currentUser?.uid?.trim() || "system";
      const result = await updateInterventionSchedule({
        db: firestore,
        intervention: selectedItem,
        allInterventions: interventions,
        requestedDate: editDate,
        requestedTime: editTime,
        audit: {
          actorUid,
          actorRole: "dispatcher",
          note: `Souhait client ${editDate} ${editTime}`,
        },
      });
      if (!result.ok) {
        if (result.reason === "conflict") {
          toast.error(t("scheduling.conflict.block_save"));
        } else {
          toast.error(t("common.error"), { description: t("backoffice.toasts.update_failed") });
        }
        return;
      }
      toast.success(t("backoffice.toasts.datetime_updated"));
      setIsEditingDateTime(false);
    } catch {
      toast.error(t("common.error"), { description: t("backoffice.toasts.update_failed") });
    }
  }, [editDate, editTime, interventions, selectedItem, setIsEditingDateTime, t]);

  return {
    handleAssignToTechnician,
    handleCancelIntervention,
    handleDragBoardSchedule,
    handleUpdateDateTime,
  };
}
