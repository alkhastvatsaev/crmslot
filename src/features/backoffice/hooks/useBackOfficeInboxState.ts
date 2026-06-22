"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { isSyntheticInterventionId } from "@/core/config/syntheticInterventions";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import { dispatcherTransitionActor } from "@/features/interventions/workflow/workflowActor";
import { useDateContext } from "@/context/DateContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { useResolvedInterventionAudio } from "@/features/backoffice/useResolvedInterventionAudio";
import type { Intervention } from "@/features/interventions/types";
import { assignInterventionFromBackoffice } from "@/features/backoffice/assignInterventionFromBackoffice";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";
import { updateInterventionSchedule } from "@/features/scheduling/updateInterventionSchedule";
import {
  candidateRangeFromScheduleFields,
  findTechnicianScheduleConflicts,
} from "@/features/scheduling/scheduleConflicts";
import { IVANA_PORTAL_MESSAGE_EVENT } from "@/features/backoffice/ivanaChatPortalBridge";
import { subscribeIvanaPortalMessages } from "@/features/backoffice/ivanaChatFirestore";
import type { IvanaPortalChatDoc } from "@/features/backoffice/ivanaChatFirestore";
import {
  countClientPortalThreadsNeedingReply,
  filterNewClientPortalMessages,
  interventionIdsWithClientPortalChat,
  showPortalChatBrowserNotification,
} from "@/features/backoffice/portalChatInboxLogic";
import { useTechnicianBackofficeReportBridgeOptional } from "@/context/TechnicianBackofficeReportBridgeContext";
import {
  mergeReportCompletionMedia,
  pickLatestBridgedReportForIntervention,
  shouldDismissBridgedTerrainReport,
} from "@/features/backoffice/mergeReportCompletionMedia";
import {
  isBackofficeReportInInboxActiveQueue,
  isBackofficeReportInInboxArchive,
} from "@/features/backoffice/backofficeReportsInboxArchive";
import {
  coerceFirestoreLikeDate,
  isInterventionInBackofficeRequestsQueue,
} from "@/features/interventions/technicianSchedule";
import { buildChatDayRows } from "@/features/backoffice/chatDayMissionRow";
import type { Mission } from "@/features/map/missionTypes";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useBackofficeReminderPush } from "@/features/reminders/useBackofficeReminderPush";
import {
  proposeAvailableSlotsForTechnician,
  proposeCompanyOpenSlots,
} from "@/features/scheduling/proposeAvailableSlots";
import { initialAssignmentDateYmd } from "@/features/scheduling/resolveSmartAssignmentSchedule";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useActivityLog } from "@/features/crmHistory/useActivityLog";
import {
  readClientPortalDefaultCompanyIdFromEnv,
  resolveBackofficeInboxCompanyIds,
} from "@/features/company/clientPortalCompanyId";
import { useFirestoreLiveEnabled } from "@/core/perf/useFirestoreLiveEnabled";

export type BackOfficeInboxStateOptions = {
  /** Coupe Firestore inbox hors rail droit / onglet caché. */
  inboxDataActive?: boolean;
};

export function useBackOfficeInboxState(
  dayMissions?: Mission[],
  options?: BackOfficeInboxStateOptions
) {
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const { logIntervention } = useActivityLog();
  const inboxCompanyIds = useMemo(() => resolveBackofficeInboxCompanyIds(workspace), [workspace]);
  const cid = inboxCompanyIds[0] ?? null;
  const inboxIntent = useBackofficeInboxIntentOptional();
  const [activeTab, setActiveTab] = useState<"chat" | "requests" | "reports" | "documents">("chat");
  const portalChatHydratedRef = useRef(false);
  const inboxFirestoreEnabled = inboxCompanyIds.length > 0;
  const inboxLive = useFirestoreLiveEnabled(options?.inboxDataActive ?? true);
  const { interventions, loading } = useBackOfficeInterventions(
    inboxFirestoreEnabled ? inboxCompanyIds : null,
    { enabled: inboxLive }
  );
  const terrainBridge = useTechnicianBackofficeReportBridgeOptional();
  const bridgedTerrainReports = useMemo(
    () => terrainBridge?.reports ?? [],
    [terrainBridge?.reports]
  );
  const pwaV2 = useFeatureFlag("pwaV2Bundle");
  useBackofficeReminderPush(inboxLive ? interventions : []);

  const [dragBoardTechUid, setDragBoardTechUid] = useState("");
  const [dragBoardDate, setDragBoardDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedItemId, setSelectedItemIdLocal] = useState<string | null>(null);
  const setSelectedItemId = (id: string | null) => {
    const next = id?.trim() ? id.trim() : null;
    setSelectedItemIdLocal(next);
    inboxIntent?.setSelectedInboxInterventionId(next);
    if (next) {
      const iv = interventions.find((x) => x.id === next);
      if (iv) logIntervention(iv);
    }
  };

  const { selectedDate } = useDateContext();
  const [selectedChatInterventionId, setSelectedChatInterventionId] = useState<string | null>(null);
  const [portalChatMessages, setPortalChatMessages] = useState<IvanaPortalChatDoc[]>([]);

  const chatDayRows = useMemo(
    () =>
      buildChatDayRows({
        interventions,
        dayMissions,
        selectedDate,
        workspace,
        includeInterventionIds: interventionIdsWithClientPortalChat(portalChatMessages),
      }),
    [dayMissions, interventions, selectedDate, workspace, portalChatMessages]
  );

  const chatThreadsNeedingReply = useMemo(
    () => countClientPortalThreadsNeedingReply(portalChatMessages),
    [portalChatMessages]
  );

  const selectedItem = useMemo(
    () => (selectedItemId ? (interventions.find((x) => x.id === selectedItemId) ?? null) : null),
    [interventions, selectedItemId]
  );

  useEffect(() => {
    const pending = inboxIntent?.pendingInboxId?.trim();
    if (!pending) return;
    setSelectedItemId(pending);
    setActiveTab("requests");
    inboxIntent?.setPendingInboxId(null);
  }, [inboxIntent?.pendingInboxId, inboxIntent]);

  useEffect(() => {
    const pendingChat = inboxIntent?.pendingChatInterventionId?.trim();
    if (!pendingChat) return;
    setSelectedChatInterventionId(pendingChat);
    setActiveTab("chat");
    inboxIntent?.setPendingChatInterventionId(null);
  }, [inboxIntent?.pendingChatInterventionId, inboxIntent]);

  useEffect(() => {
    inboxIntent?.setActiveInboxTab(activeTab);
  }, [activeTab, inboxIntent]);

  const handleDownloadQuotePdf = async (interventionId: string) => {
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
  };

  const selectedReportCompletion = useMemo(() => {
    if (!selectedItem) return { photoUrls: [] as string[], signatureUrl: null as string | null };
    if (isInterventionInBackofficeRequestsQueue(selectedItem)) {
      return { photoUrls: [], signatureUrl: null };
    }
    const bridged = pickLatestBridgedReportForIntervention(bridgedTerrainReports, selectedItem.id);
    return mergeReportCompletionMedia(selectedItem, bridged);
  }, [selectedItem, bridgedTerrainReports]);

  const [selectedTerrainLocalId, setSelectedTerrainLocalId] = useState<string | null>(null);
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const editScheduleConflicts = useMemo(() => {
    if (!selectedItem || !isEditingDateTime) return [];
    const tech = (selectedItem.assignedTechnicianUid ?? "").trim();
    const range = candidateRangeFromScheduleFields(editDate, editTime);
    if (!tech || !range) return [];
    return findTechnicianScheduleConflicts({
      interventions,
      technicianUid: tech,
      candidateRange: range,
      excludeInterventionId: selectedItem.id,
    });
  }, [selectedItem, isEditingDateTime, editDate, editTime, interventions]);

  const intakeProposedSlots = useMemo(() => {
    if (!selectedItem || !isEditingDateTime) return [];
    const dateYmd = editDate.trim() || initialAssignmentDateYmd(selectedItem, new Date());
    const tech = (selectedItem.assignedTechnicianUid ?? "").trim();
    if (tech) {
      return proposeAvailableSlotsForTechnician({
        interventions,
        technicianUid: tech,
        dateYmd,
        excludeInterventionId: selectedItem.id,
      });
    }
    return proposeCompanyOpenSlots({ interventions, dateYmd });
  }, [selectedItem, isEditingDateTime, editDate, interventions]);

  const intakeSlotsTitleKey = (selectedItem?.assignedTechnicianUid ?? "").trim()
    ? "scheduling.proposed_slots.title"
    : "scheduling.proposed_slots.company_title";

  const [reportsArchiveExpanded, setReportsArchiveExpanded] = useState(false);
  const [prevActiveTab, setPrevActiveTab] = useState(activeTab);
  if (prevActiveTab !== activeTab) {
    setPrevActiveTab(activeTab);
    if (activeTab !== "reports") setReportsArchiveExpanded(false);
  }
  const [assignPickerOpen, setAssignPickerOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const envDefaultCompanyId = useMemo(() => readClientPortalDefaultCompanyIdFromEnv(), []);

  const ivanaChatCompanyId = (cid ?? envDefaultCompanyId) || null;

  const terrainIv = useMemo(() => {
    if (!selectedTerrainLocalId) return null;
    const r = bridgedTerrainReports.find((x) => x.localId === selectedTerrainLocalId);
    if (!r) return null;
    return interventions.find((x) => x.id === r.interventionId) ?? null;
  }, [selectedTerrainLocalId, bridgedTerrainReports, interventions]);

  const { resolvedAudioUrl, isResolvingAudio, audioStorageResolveFailed } =
    useResolvedInterventionAudio(selectedItem);
  const {
    resolvedAudioUrl: terrainResolvedAudioUrl,
    isResolvingAudio: terrainAudioLoading,
    audioStorageResolveFailed: terrainAudioFailed,
  } = useResolvedInterventionAudio(selectedTerrainLocalId ? terrainIv : null);

  const pendingRequests = useMemo(
    () =>
      interventions
        .filter((inv) => isInterventionInBackofficeRequestsQueue(inv))
        .sort((a, b) => {
          const timeA = coerceFirestoreLikeDate(a.createdAt)?.getTime() ?? 0;
          const timeB = coerceFirestoreLikeDate(b.createdAt)?.getTime() ?? 0;
          return timeB - timeA;
        }),
    [interventions]
  );

  const validationReports = useMemo(
    () =>
      interventions
        .filter((inv) => inv.status === "done" || inv.status === "invoiced")
        .sort((a, b) => {
          const timeA = coerceFirestoreLikeDate(a.completedAt)?.getTime() ?? 0;
          const timeB = coerceFirestoreLikeDate(b.completedAt)?.getTime() ?? 0;
          return timeB - timeA;
        }),
    [interventions]
  );

  const reportsToValidateList = useMemo(
    () => validationReports.filter((iv) => isBackofficeReportInInboxActiveQueue(iv)),
    [validationReports]
  );

  const reportsArchivedList = useMemo(
    () => validationReports.filter((iv) => isBackofficeReportInInboxArchive(iv)),
    [validationReports]
  );

  const bridgedTerrainVisible = useMemo(() => {
    const syncedIds = new Set(reportsToValidateList.map((iv) => iv.id));
    return bridgedTerrainReports.filter((r) => !syncedIds.has(r.interventionId));
  }, [bridgedTerrainReports, reportsToValidateList]);

  const bridgedTerrainCount = bridgedTerrainVisible.length;

  const handleDelete = async (id: string) => {
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
  };

  const handleCancelIntervention = async (id: string) => {
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
  };

  const handleVerify = async (id: string) => {
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
      if (terrainBridge) {
        const lids = terrainBridge.reports
          .filter((r) => r.interventionId === id)
          .map((r) => r.localId);
        lids.forEach((lid) => terrainBridge.dismissReport(lid));
      }
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
  };

  const handleArchiveReport = async (id: string) => {
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
  };

  const handleRejectReport = async (id: string, reason?: string) => {
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
      if (terrainBridge) {
        terrainBridge.reports
          .filter((r) => r.interventionId === id)
          .forEach((r) => terrainBridge.dismissReport(r.localId));
      }
      setSelectedTerrainLocalId(null);
    } catch (e) {
      logger.error("Rejet rapport:", { error: e instanceof Error ? e.message : String(e) });
      toast.error(t("common.error"), {
        description: e instanceof Error ? e.message : t("common.try_again"),
      });
    }
  };

  const handleDragBoardSchedule = async (
    interventionId: string,
    time: string,
    technicianUidOverride?: string
  ) => {
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
  };

  const handleUpdateDateTime = async () => {
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
  };

  const isTenant = !!workspace?.isTenantUser;
  const workspaceReady = workspace?.workspaceReady !== false;

  useEffect(() => {
    if (!terrainBridge) return;
    bridgedTerrainReports.forEach((r) => {
      const iv = interventions.find((x) => x.id === r.interventionId);
      if (shouldDismissBridgedTerrainReport(iv)) {
        terrainBridge.dismissReport(r.localId);
      }
    });
  }, [bridgedTerrainReports, interventions, terrainBridge]);

  useEffect(() => {
    if (!selectedTerrainLocalId) return;
    if (!bridgedTerrainReports.some((r) => r.localId === selectedTerrainLocalId)) {
      setSelectedTerrainLocalId(null);
    }
  }, [selectedTerrainLocalId, bridgedTerrainReports]);

  useEffect(() => {
    if (!selectedItemId || activeTab !== "reports") return;
    const iv = interventions.find((x) => x.id === selectedItemId);
    // Rapports à valider (done) et archive (invoiced) restent consultables.
    if (iv && iv.status !== "done" && iv.status !== "invoiced") {
      setSelectedItemId(null);
    }
  }, [selectedItemId, interventions, activeTab]);

  useEffect(() => {
    if (!isTenant) return;
    const openChat = () => setActiveTab("chat");
    window.addEventListener(IVANA_PORTAL_MESSAGE_EVENT, openChat);
    return () => window.removeEventListener(IVANA_PORTAL_MESSAGE_EVENT, openChat);
  }, [isTenant]);

  useEffect(() => {
    if (!inboxLive || !isConfigured || !firestore || !ivanaChatCompanyId || !isTenant) return;

    portalChatHydratedRef.current = false;
    const seen = new Set<string>();
    return subscribeIvanaPortalMessages(
      firestore,
      ivanaChatCompanyId,
      (rows) => {
        setPortalChatMessages(rows);
        if (!portalChatHydratedRef.current) {
          portalChatHydratedRef.current = true;
          rows.forEach((r) => seen.add(r.id));
          return;
        }

        const uid = auth?.currentUser?.uid;
        const incoming = filterNewClientPortalMessages(rows, seen, uid);
        incoming.forEach((r) => seen.add(r.id));
        if (incoming.length === 0) return;

        setActiveTab("chat");
        const ivId = incoming[incoming.length - 1]?.interventionId?.trim();
        setSelectedChatInterventionId(ivId || "global");

        const preview = incoming[incoming.length - 1]?.body?.trim() || "Nouveau message client";
        showPortalChatBrowserNotification(
          String(t("backoffice.inbox.tabs.chat")),
          preview,
          `portal-chat-${ivId || "global"}`
        );
      },
      (err) => {
        logger.error("[useBackOfficeInboxState] portal chat watch", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    );
  }, [inboxLive, ivanaChatCompanyId, isTenant, t]);

  const reportsTabBadgeCount =
    reportsToValidateList.filter((iv) => iv.status === "done").length + bridgedTerrainCount;
  const reportsNothingAtAll =
    reportsToValidateList.length === 0 &&
    bridgedTerrainCount === 0 &&
    reportsArchivedList.length === 0;
  const itemsToShow = activeTab === "requests" ? pendingRequests : reportsToValidateList;

  return {
    // context / config
    cid,
    isTenant,
    workspaceReady,
    ivanaChatCompanyId,
    pwaV2,
    workspace,
    interventions,
    loading,
    terrainBridge,
    bridgedTerrainReports,
    // tab state
    activeTab,
    setActiveTab,
    // drag board
    dragBoardTechUid,
    setDragBoardTechUid,
    dragBoardDate,
    setDragBoardDate,
    // selected item
    selectedItem,
    selectedItemId,
    setSelectedItemId,
    // chat
    selectedChatInterventionId,
    setSelectedChatInterventionId,
    chatDayRows,
    chatThreadsNeedingReply,
    isEditingDateTime,
    setIsEditingDateTime,
    editDate,
    setEditDate,
    editTime,
    setEditTime,
    editScheduleConflicts,
    intakeProposedSlots,
    intakeSlotsTitleKey,
    // archive
    reportsArchiveExpanded,
    setReportsArchiveExpanded,
    // assign picker
    assignPickerOpen,
    setAssignPickerOpen,
    isAssigning,
    // terrain report
    selectedTerrainLocalId,
    setSelectedTerrainLocalId,
    terrainIv,
    terrainResolvedAudioUrl,
    terrainAudioLoading,
    terrainAudioFailed,
    // audio
    resolvedAudioUrl,
    isResolvingAudio,
    audioStorageResolveFailed,
    // derived lists
    pendingRequests,
    reportsToValidateList,
    reportsArchivedList,
    bridgedTerrainVisible,
    bridgedTerrainCount,
    reportsTabBadgeCount,
    reportsNothingAtAll,
    itemsToShow,
    selectedReportCompletion,
    // handlers
    handleDelete,
    handleAssignToTechnician,
    handleCancelIntervention,
    handleVerify,
    handleArchiveReport,
    handleRejectReport,
    handleDragBoardSchedule,
    handleUpdateDateTime,
    handleDownloadQuotePdf,
  };
}
