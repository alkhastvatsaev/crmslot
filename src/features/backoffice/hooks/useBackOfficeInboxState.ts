"use client";

import { useMemo } from "react";
import { useDateContext } from "@/context/DateContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { useTechnicianBackofficeReportBridgeOptional } from "@/context/TechnicianBackofficeReportBridgeContext";
import { useFirestoreLiveEnabled } from "@/core/perf/useFirestoreLiveEnabled";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  isBackofficeReportInInboxActiveQueue,
  isBackofficeReportInInboxArchive,
} from "@/features/backoffice/backofficeReportsInboxArchive";
import {
  computeBridgedTerrainVisible,
  computeInboxListMetrics,
  computePendingRequests,
  computeValidationReports,
} from "@/features/backoffice/backOfficeInboxLists";
import type { BackOfficeInboxStateOptions } from "@/features/backoffice/backOfficeInboxTypes";
import { useBackOfficeInboxActions } from "@/features/backoffice/hooks/useBackOfficeInboxActions";
import { useBackOfficeInboxPortalChat } from "@/features/backoffice/hooks/useBackOfficeInboxPortalChat";
import { useBackOfficeInboxSelection } from "@/features/backoffice/hooks/useBackOfficeInboxSelection";
import { useBackOfficeInboxTerrainBridge } from "@/features/backoffice/hooks/useBackOfficeInboxTerrainBridge";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { useResolvedInterventionAudio } from "@/features/backoffice/useResolvedInterventionAudio";
import {
  readClientPortalDefaultCompanyIdFromEnv,
  resolveBackofficeInboxCompanyIds,
  resolvePortalChatCompanyId,
  resolvePortalChatInboxCompanyIds,
} from "@/features/company/clientPortalCompanyId";
import { useActivityLog } from "@/features/crmHistory/useActivityLog";
import type { Mission } from "@/features/map";
import { useBackofficeReminderPush } from "@/features/reminders/useBackofficeReminderPush";
import {
  candidateRangeFromScheduleFields,
  findTechnicianScheduleConflicts,
} from "@/features/scheduling/scheduleConflicts";
import {
  proposeAvailableSlotsForTechnician,
  proposeCompanyOpenSlots,
} from "@/features/scheduling/proposeAvailableSlots";
import { initialAssignmentDateYmd } from "@/features/scheduling/resolveSmartAssignmentSchedule";

export type { BackOfficeInboxStateOptions } from "@/features/backoffice/backOfficeInboxTypes";

export function useBackOfficeInboxState(
  dayMissions?: Mission[],
  options?: BackOfficeInboxStateOptions
) {
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const { logIntervention } = useActivityLog();
  const inboxCompanyIds = useMemo(() => resolveBackofficeInboxCompanyIds(workspace), [workspace]);
  const portalChatInboxCompanyIds = useMemo(
    () => resolvePortalChatInboxCompanyIds(workspace),
    [workspace]
  );
  const interventionCompanyIds = useMemo(() => {
    const ids = new Set<string>();
    for (const id of inboxCompanyIds) ids.add(id);
    for (const id of portalChatInboxCompanyIds) ids.add(id);
    return [...ids];
  }, [inboxCompanyIds, portalChatInboxCompanyIds]);
  const cid = interventionCompanyIds[0] ?? inboxCompanyIds[0] ?? null;
  const inboxIntent = useBackofficeInboxIntentOptional();
  const inboxFirestoreEnabled = interventionCompanyIds.length > 0;
  const inboxLive = useFirestoreLiveEnabled(options?.inboxDataActive ?? true);
  const { interventions, loading } = useBackOfficeInterventions(
    inboxFirestoreEnabled ? interventionCompanyIds : null,
    { enabled: inboxLive }
  );
  const terrainBridge = useTechnicianBackofficeReportBridgeOptional();
  const bridgedTerrainReports = useMemo(
    () => terrainBridge?.reports ?? [],
    [terrainBridge?.reports]
  );
  const pwaV2 = useFeatureFlag("pwaV2Bundle");
  useBackofficeReminderPush(inboxLive ? interventions : []);

  const selection = useBackOfficeInboxSelection({
    interventions,
    inboxIntent,
    logIntervention,
  });

  const { selectedDate } = useDateContext();
  const envDefaultCompanyId = useMemo(() => readClientPortalDefaultCompanyIdFromEnv(), []);
  const portalChatCompanyId = useMemo(
    () => resolvePortalChatCompanyId(envDefaultCompanyId || cid) ?? cid,
    [envDefaultCompanyId, cid]
  );
  const isTenant = !!workspace?.isTenantUser;
  const workspaceReady = workspace?.workspaceReady !== false;

  const { chatDayRows, chatThreadsNeedingReply } = useBackOfficeInboxPortalChat({
    dayMissions,
    interventions,
    selectedDate,
    workspace,
    inboxLive,
    isTenant,
    inboxCompanyIds: portalChatInboxCompanyIds,
    setActiveTab: selection.setActiveTab,
    setSelectedChatInterventionId: selection.setSelectedChatInterventionId,
    chatTabLabel: String(t("backoffice.inbox.tabs.chat")),
  });

  const pendingRequests = useMemo(() => computePendingRequests(interventions), [interventions]);
  const validationReports = useMemo(() => computeValidationReports(interventions), [interventions]);
  const reportsToValidateList = useMemo(
    () => validationReports.filter((iv) => isBackofficeReportInInboxActiveQueue(iv)),
    [validationReports]
  );
  const reportsArchivedList = useMemo(
    () => validationReports.filter((iv) => isBackofficeReportInInboxArchive(iv)),
    [validationReports]
  );
  const bridgedTerrainVisible = useMemo(
    () => computeBridgedTerrainVisible(bridgedTerrainReports, reportsToValidateList),
    [bridgedTerrainReports, reportsToValidateList]
  );
  const bridgedTerrainCount = bridgedTerrainVisible.length;

  const { reportsTabBadgeCount, reportsNothingAtAll, itemsToShow } = useMemo(
    () =>
      computeInboxListMetrics(
        selection.activeTab,
        pendingRequests,
        reportsToValidateList,
        reportsArchivedList,
        bridgedTerrainCount
      ),
    [
      bridgedTerrainCount,
      pendingRequests,
      reportsArchivedList,
      reportsToValidateList,
      selection.activeTab,
    ]
  );

  const { selectedReportCompletion, terrainIv } = useBackOfficeInboxTerrainBridge({
    interventions,
    bridgedTerrainReports,
    terrainBridge,
    selectedItem: selection.selectedItem,
    selectedTerrainLocalId: selection.selectedTerrainLocalId,
    setSelectedTerrainLocalId: selection.setSelectedTerrainLocalId,
  });

  const { resolvedAudioUrl, isResolvingAudio, audioStorageResolveFailed } =
    useResolvedInterventionAudio(selection.selectedItem);
  const {
    resolvedAudioUrl: terrainResolvedAudioUrl,
    isResolvingAudio: terrainAudioLoading,
    audioStorageResolveFailed: terrainAudioFailed,
  } = useResolvedInterventionAudio(selection.selectedTerrainLocalId ? terrainIv : null);

  const editScheduleConflicts = useMemo(() => {
    if (!selection.selectedItem || !selection.isEditingDateTime) return [];
    const tech = (selection.selectedItem.assignedTechnicianUid ?? "").trim();
    const range = candidateRangeFromScheduleFields(selection.editDate, selection.editTime);
    if (!tech || !range) return [];
    return findTechnicianScheduleConflicts({
      interventions,
      technicianUid: tech,
      candidateRange: range,
      excludeInterventionId: selection.selectedItem.id,
    });
  }, [
    interventions,
    selection.editDate,
    selection.editTime,
    selection.isEditingDateTime,
    selection.selectedItem,
  ]);

  const intakeProposedSlots = useMemo(() => {
    if (!selection.selectedItem || !selection.isEditingDateTime) return [];
    const dateYmd =
      selection.editDate.trim() || initialAssignmentDateYmd(selection.selectedItem, new Date());
    const tech = (selection.selectedItem.assignedTechnicianUid ?? "").trim();
    if (tech) {
      return proposeAvailableSlotsForTechnician({
        interventions,
        technicianUid: tech,
        dateYmd,
        excludeInterventionId: selection.selectedItem.id,
      });
    }
    return proposeCompanyOpenSlots({ interventions, dateYmd });
  }, [interventions, selection.editDate, selection.isEditingDateTime, selection.selectedItem]);

  const intakeSlotsTitleKey = (selection.selectedItem?.assignedTechnicianUid ?? "").trim()
    ? "scheduling.proposed_slots.title"
    : "scheduling.proposed_slots.company_title";

  const actions = useBackOfficeInboxActions({
    interventions,
    selectedItem: selection.selectedItem,
    dragBoardTechUid: selection.dragBoardTechUid,
    dragBoardDate: selection.dragBoardDate,
    editDate: selection.editDate,
    editTime: selection.editTime,
    terrainBridge,
    setSelectedItemId: selection.setSelectedItemId,
    setSelectedTerrainLocalId: selection.setSelectedTerrainLocalId,
    setAssignPickerOpen: selection.setAssignPickerOpen,
    setIsAssigning: selection.setIsAssigning,
    setIsEditingDateTime: selection.setIsEditingDateTime,
    t,
  });

  return {
    cid,
    isTenant,
    workspaceReady,
    portalChatCompanyId,
    pwaV2,
    workspace,
    interventions,
    loading,
    terrainBridge,
    bridgedTerrainReports,
    activeTab: selection.activeTab,
    setActiveTab: selection.setActiveTab,
    dragBoardTechUid: selection.dragBoardTechUid,
    setDragBoardTechUid: selection.setDragBoardTechUid,
    dragBoardDate: selection.dragBoardDate,
    setDragBoardDate: selection.setDragBoardDate,
    selectedItem: selection.selectedItem,
    selectedItemId: selection.selectedItemId,
    setSelectedItemId: selection.setSelectedItemId,
    selectedChatInterventionId: selection.selectedChatInterventionId,
    setSelectedChatInterventionId: selection.setSelectedChatInterventionId,
    chatDayRows,
    chatThreadsNeedingReply,
    isEditingDateTime: selection.isEditingDateTime,
    setIsEditingDateTime: selection.setIsEditingDateTime,
    editDate: selection.editDate,
    setEditDate: selection.setEditDate,
    editTime: selection.editTime,
    setEditTime: selection.setEditTime,
    editScheduleConflicts,
    intakeProposedSlots,
    intakeSlotsTitleKey,
    reportsArchiveExpanded: selection.reportsArchiveExpanded,
    setReportsArchiveExpanded: selection.setReportsArchiveExpanded,
    assignPickerOpen: selection.assignPickerOpen,
    setAssignPickerOpen: selection.setAssignPickerOpen,
    isAssigning: selection.isAssigning,
    selectedTerrainLocalId: selection.selectedTerrainLocalId,
    setSelectedTerrainLocalId: selection.setSelectedTerrainLocalId,
    terrainIv,
    terrainResolvedAudioUrl,
    terrainAudioLoading,
    terrainAudioFailed,
    resolvedAudioUrl,
    isResolvingAudio,
    audioStorageResolveFailed,
    pendingRequests,
    reportsToValidateList,
    reportsArchivedList,
    bridgedTerrainVisible,
    bridgedTerrainCount,
    reportsTabBadgeCount,
    reportsNothingAtAll,
    itemsToShow,
    selectedReportCompletion,
    ...actions,
  };
}
