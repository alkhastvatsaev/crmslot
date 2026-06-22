"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { isSyntheticInterventionId } from "@/core/config/syntheticInterventions";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { TechnicianBackofficeReportBridgeApi } from "@/context/TechnicianBackofficeReportBridgeContext";
import { assignInterventionFromBackoffice } from "@/features/backoffice/assignInterventionFromBackoffice";
import { isBackofficeReportInInboxActiveQueue } from "@/features/backoffice/backofficeReportsInboxArchive";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import { dispatcherTransitionActor } from "@/features/interventions/workflow/workflowActor";
import type { Intervention } from "@/features/interventions/types";
import { updateInterventionSchedule } from "@/features/scheduling/updateInterventionSchedule";

type InboxActionsArgs = {
  interventions: Intervention[];
  selectedItem: Intervention | null;
  dragBoardTechUid: string;
  dragBoardDate: string;
  editDate: string;
  editTime: string;
  terrainBridge: TechnicianBackofficeReportBridgeApi | null;
  setSelectedItemId: (id: string | null) => void;
  setSelectedTerrainLocalId: (id: string | null) => void;
  setAssignPickerOpen: (open: boolean) => void;
  setIsAssigning: (assigning: boolean) => void;
  setIsEditingDateTime: (editing: boolean) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

export function useBackOfficeInboxActions({
  interventions,
  selectedItem,
  dragBoardTechUid,
  dragBoardDate,
  editDate,
  editTime,
  terrainBridge,
  setSelectedItemId,
  setSelectedTerrainLocalId,
  setAssignPickerOpen,
  setIsAssigning,
  setIsEditingDateTime,
  t,
}: InboxActionsArgs) {
  const handleDownloadQuotePdf = useCallback(
    async (interventionId: string) => {
      try {
        const res = await fetchWithAuth(
          `/api/interventions/${encodeURIComponent(interventionId)}/quote-pdf`
        );
        if (!res.ok) throw new Error("pdf failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `devis-${interventionId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        toast.error(String(t("common.error")));
      }
    },
    [t]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (isSyntheticInterventionId(id)) {
        toast.success(t("backoffice.toasts.request_deleted"));
        setSelectedItemId(null);
        return;
      }
      if (!firestore) return;
      const row = interventions.find((x) => x.id === id);
      const actorUid = auth?.currentUser?.uid?.trim() || "system";
      try {
        if (row) {
          await logCrmInterventionAction({
            kind: "intervention_deleted",
            iv: row,
            actorUid,
            actorRole: "dispatcher",
            note: "Suppression dossier (IVANA / dispatcher)",
          });
        }
        await deleteDoc(doc(firestore, "interventions", id));
        toast.success(t("backoffice.toasts.request_deleted"));
        setSelectedItemId(null);
      } catch {
        toast.error(t("common.error"), { description: t("backoffice.toasts.delete_failed") });
      }
    },
    [interventions, setSelectedItemId, t]
  );

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

  const dismissTerrainReportsForIntervention = useCallback(
    (id: string) => {
      if (!terrainBridge) return;
      terrainBridge.reports
        .filter((r) => r.interventionId === id)
        .forEach((r) => terrainBridge.dismissReport(r.localId));
    },
    [terrainBridge]
  );

  const handleVerify = useCallback(
    async (id: string) => {
      try {
        const row = interventions.find((x) => x.id === id);
        if (!row) return;
        const actorUid = auth?.currentUser?.uid?.trim();
        if (!actorUid) return;
        const res = await fetchWithAuth(
          `/api/interventions/${encodeURIComponent(id)}/validate-report`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sendEmail: true }),
          }
        );
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          emailSent?: boolean;
          emailError?: string;
        };
        if (!res.ok || !data.ok) {
          throw new Error(data.error || t("common.try_again"));
        }
        await logCrmInterventionAction({
          kind: "intervention_report_validated",
          iv: row,
          actorUid,
          actorRole: "dispatcher",
          statusBefore: row.status,
          statusAfter: "invoiced",
          note: data.emailSent
            ? "Validation rapport IVANA — facture PDF + e-mail client"
            : "Validation rapport IVANA — facture PDF",
        });
        if (data.emailError) {
          toast.message(String(t("backoffice.toasts.report_verified")), {
            description: data.emailError,
          });
        } else {
          toast.success(t("backoffice.toasts.report_verified"));
        }
        setSelectedItemId(null);
        dismissTerrainReportsForIntervention(id);
        setSelectedTerrainLocalId(null);
      } catch (e) {
        logger.error("Validation rapport:", { error: e instanceof Error ? e.message : String(e) });
        const code =
          typeof e === "object" && e !== null && "code" in e
            ? String((e as { code?: string }).code)
            : "";
        toast.error(t("common.error"), {
          description:
            code === "permission-denied"
              ? t("backoffice.toasts.permission_denied_verify")
              : e instanceof Error
                ? e.message
                : t("common.try_again"),
        });
      }
    },
    [
      dismissTerrainReportsForIntervention,
      interventions,
      setSelectedItemId,
      setSelectedTerrainLocalId,
      t,
    ]
  );

  const handleArchiveReport = useCallback(
    async (id: string) => {
      if (!firestore) {
        toast.error(t("backoffice.toasts.firestore_unavailable"));
        return;
      }
      const row = interventions.find((x) => x.id === id);
      if (!row || !isBackofficeReportInInboxActiveQueue(row)) return;
      const actorUid = auth?.currentUser?.uid?.trim();
      if (!actorUid) return;
      const archivedAt = new Date().toISOString();
      try {
        await updateDoc(doc(firestore, "interventions", id), {
          backofficeReportsArchivedAt: archivedAt,
          technicianReportAmendedAt: null,
          technicianReportAmendedByUid: null,
        });
        await logCrmInterventionAction({
          kind: "intervention_report_archived",
          iv: row,
          actorUid,
          actorRole: "dispatcher",
          note: "Rapport archivé (inbox IVANA)",
        });
        toast.success(t("backoffice.toasts.report_archived"));
        setSelectedItemId(null);
        setSelectedTerrainLocalId(null);
      } catch (e) {
        logger.error("Archivage rapport:", { error: e instanceof Error ? e.message : String(e) });
        toast.error(t("common.error"), {
          description: e instanceof Error ? e.message : t("common.try_again"),
        });
      }
    },
    [interventions, setSelectedItemId, setSelectedTerrainLocalId, t]
  );

  const handleRejectReport = useCallback(
    async (id: string, reason?: string) => {
      try {
        const row = interventions.find((x) => x.id === id);
        if (!row) return;
        const actorUid = auth?.currentUser?.uid?.trim();
        if (!actorUid) return;
        const res = await fetchWithAuth(
          `/api/interventions/${encodeURIComponent(id)}/reject-report`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: reason?.trim() || undefined }),
          }
        );
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) throw new Error(data.error || t("common.try_again"));
        await logCrmInterventionAction({
          kind: "intervention_report_rejected",
          iv: row,
          actorUid,
          actorRole: "dispatcher",
          statusBefore: row.status,
          statusAfter: "in_progress",
          note: reason ? `Rapport refusé — ${reason}` : "Rapport refusé — renvoyé au technicien",
        });
        toast.success(t("backoffice.toasts.report_rejected"));
        setSelectedItemId(null);
        dismissTerrainReportsForIntervention(id);
        setSelectedTerrainLocalId(null);
      } catch (e) {
        logger.error("Rejet rapport:", { error: e instanceof Error ? e.message : String(e) });
        toast.error(t("common.error"), {
          description: e instanceof Error ? e.message : t("common.try_again"),
        });
      }
    },
    [
      dismissTerrainReportsForIntervention,
      interventions,
      setSelectedItemId,
      setSelectedTerrainLocalId,
      t,
    ]
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
    handleDownloadQuotePdf,
    handleDelete,
    handleAssignToTechnician,
    handleCancelIntervention,
    handleVerify,
    handleArchiveReport,
    handleRejectReport,
    handleDragBoardSchedule,
    handleUpdateDateTime,
  };
}
