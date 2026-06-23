"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, firestore } from "@/core/config/firebase";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";
import { isSyntheticInterventionId } from "@/core/config/syntheticInterventions";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import type { Intervention } from "@/features/interventions/types";
import { assignInterventionFromBackoffice } from "@/features/backoffice/assignInterventionFromBackoffice";
import { isInterventionInBackofficeRequestsQueue } from "@/features/interventions/technicianSchedule";
import { useResolvedInterventionAudio } from "@/features/backoffice/useResolvedInterventionAudio";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { resolveBackofficeInboxCompanyIds } from "@/features/company/clientPortalCompanyId";

export function useIncomingClientRequestsController() {
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const slaEnabled = useFeatureFlag("slaTracker");

  const inboxCompanyIds = resolveBackofficeInboxCompanyIds(workspace);
  const { interventions, loading } = useBackOfficeInterventions(
    inboxCompanyIds.length > 0 ? inboxCompanyIds : null
  );

  const [selectedRequest, setSelectedRequest] = useState<Intervention | null>(null);
  const { resolvedAudioUrl } = useResolvedInterventionAudio(selectedRequest);
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [assignPickerOpen, setAssignPickerOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const pendingRequests = useMemo(
    () =>
      interventions
        .filter((inv) => isInterventionInBackofficeRequestsQueue(inv))
        .sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ),
    [interventions]
  );

  const hasWorkspace =
    Boolean(workspace) &&
    Boolean(workspace?.isTenantUser) &&
    Boolean(workspace?.memberships.length);

  const closeDetail = () => {
    setSelectedRequest(null);
    setIsEditingDateTime(false);
    setAssignPickerOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (isSyntheticInterventionId(id)) {
      toast.success(String(t("backoffice.toasts.request_deleted")));
      setSelectedRequest(null);
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
          note: "Suppression demande (file entrante)",
        });
      }
      await deleteDoc(doc(firestore, "interventions", id));
      toast.success(String(t("backoffice.toasts.request_deleted")));
      setSelectedRequest(null);
    } catch {
      toast.error(String(t("backoffice.toasts.delete_failed")));
    }
  };

  const handleAssignToTechnician = async (
    id: string,
    technicianUid: string,
    schedule?: { scheduledDate: string; scheduledTime: string }
  ) => {
    if (!firestore) return;
    setIsAssigning(true);
    try {
      const row = interventions.find((x) => x.id === id);
      if (!row) {
        toast.error(String(t("backoffice.toasts.assign_failed")));
        return;
      }
      await assignInterventionFromBackoffice(id, row, technicianUid, schedule);
      toast.success(String(t("backoffice.toasts.request_assigned")));
      setAssignPickerOpen(false);
      setSelectedRequest(null);
    } catch (e) {
      const code =
        typeof e === "object" && e !== null && "code" in e
          ? String((e as { code?: string }).code)
          : "";
      const description =
        code === "permission-denied"
          ? String(t("backoffice.toasts.permission_denied_verify"))
          : code === "admin-unavailable"
            ? String(t("backoffice.toasts.admin_unavailable"))
            : e instanceof Error
              ? e.message
              : String(t("backoffice.toasts.assign_failed"));
      toast.error(description);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdateDateTime = async () => {
    if (!selectedRequest || !firestore) return;
    try {
      const actorUid = auth?.currentUser?.uid?.trim() || "system";
      await updateDoc(doc(firestore, "interventions", selectedRequest.id), {
        requestedDate: editDate,
        requestedTime: editTime,
      });
      await logCrmInterventionAction({
        kind: "intervention_schedule_updated",
        iv: selectedRequest,
        actorUid,
        actorRole: "dispatcher",
        note: `Souhait client ${editDate} ${editTime}`,
      });
      toast.success(String(t("backoffice.toasts.datetime_updated")));
      setSelectedRequest({
        ...selectedRequest,
        requestedDate: editDate,
        requestedTime: editTime,
      });
      setIsEditingDateTime(false);
    } catch {
      toast.error(String(t("backoffice.toasts.update_failed")));
    }
  };

  const startEditDateTime = () => {
    if (!selectedRequest) return;
    setEditDate(selectedRequest.requestedDate || "");
    setEditTime(selectedRequest.requestedTime || "");
    setIsEditingDateTime(true);
  };

  return {
    t,
    slaEnabled,
    interventions,
    loading,
    pendingRequests,
    hasWorkspace,
    selectedRequest,
    setSelectedRequest,
    resolvedAudioUrl,
    isEditingDateTime,
    setIsEditingDateTime,
    editDate,
    setEditDate,
    editTime,
    setEditTime,
    assignPickerOpen,
    setAssignPickerOpen,
    isAssigning,
    closeDetail,
    handleDelete,
    handleAssignToTechnician,
    handleUpdateDateTime,
    startEditDateTime,
  };
}
