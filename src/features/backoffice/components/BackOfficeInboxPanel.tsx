"use client";

import { AnimatePresence } from "framer-motion";
import { HUB_SURFACE, HubSegmentedControl } from "@/core/ui/hub";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Mission } from "@/features/map";
import CompanyChatPanel from "@/features/backoffice/components/CompanyChatPanel";
import ChatbotDocumentsRightPanel from "@/features/chatbot/components/ChatbotDocumentsRightPanel";
import ScheduleDragBoard from "@/features/scheduling/components/ScheduleDragBoard";
import { useBackOfficeInboxState } from "@/features/backoffice/hooks/useBackOfficeInboxState";
import BackOfficeInboxChatTab from "@/features/backoffice/components/BackOfficeInboxChatTab";
import BackOfficeInboxListTab from "@/features/backoffice/components/BackOfficeInboxListTab";
import InterventionDetailPanel from "@/features/backoffice/components/InterventionDetailPanel";
import TerrainReportDetailPanel from "@/features/backoffice/components/TerrainReportDetailPanel";

type BackOfficeInboxPanelProps = {
  /** Missions affichées dans le rail gauche « du jour » (y compris démo). */
  dayMissions?: Mission[];
  /** Coupe listeners Firestore inbox hors rail droit. */
  inboxDataActive?: boolean;
};

export default function BackOfficeInboxPanel({
  dayMissions,
  inboxDataActive = true,
}: BackOfficeInboxPanelProps) {
  const { t } = useTranslation();
  const s = useBackOfficeInboxState(dayMissions, { inboxDataActive });

  if (!s.isTenant) {
    if (!s.workspaceReady) {
      return (
        <div
          data-testid="backoffice-inbox-panel"
          className={cn(
            "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]",
            HUB_SURFACE.muted
          )}
        >
          <div
            data-testid="backoffice-inbox-loading"
            className="flex flex-1 flex-col gap-3 px-4 py-6"
            aria-busy="true"
          >
            <div className="h-10 animate-pulse rounded-xl bg-slate-200/80" />
            <div className="h-24 animate-pulse rounded-[24px] bg-white/70 border border-slate-200/50" />
            <div className="h-24 animate-pulse rounded-[24px] bg-white/70 border border-slate-200/50" />
          </div>
        </div>
      );
    }

    return (
      <div
        data-testid="backoffice-inbox-panel"
        className={cn(
          "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]",
          HUB_SURFACE.muted
        )}
      >
        <CompanyChatPanel
          className="min-h-0 flex-1"
          acceptPortalMessages
          chatCompanyId={s.portalChatCompanyId}
        />
      </div>
    );
  }

  const listTabActive = s.activeTab === "requests" || s.activeTab === "reports";

  return (
    <div
      data-testid="backoffice-inbox-panel"
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]",
        HUB_SURFACE.muted
      )}
    >
      {s.pwaV2 && s.activeTab === "requests" ? (
        <div className="mx-4 mt-2">
          <ScheduleDragBoard
            interventions={s.interventions}
            technicianUid={s.dragBoardTechUid}
            onTechnicianChange={s.setDragBoardTechUid}
            dateYmd={s.dragBoardDate}
            onDateChange={s.setDragBoardDate}
            onSchedule={(id, time) => void s.handleDragBoardSchedule(id, time)}
          />
        </div>
      ) : null}

      <HubSegmentedControl
        value={s.activeTab}
        onChange={(id) => s.setActiveTab(id as "chat" | "requests" | "reports" | "documents")}
        className="mx-4 my-4 shrink-0"
        options={[
          {
            id: "requests",
            label: t("backoffice.inbox.tabs.requests"),
            testId: "backoffice-inbox-tab-requests",
            activeAccent: "blue",
            badge: s.pendingRequests.length,
            badgeAccent: "blue",
          },
          {
            id: "reports",
            label: t("backoffice.inbox.tabs.reports"),
            testId: "backoffice-inbox-tab-reports",
            activeAccent: "emerald",
            badge: s.reportsTabBadgeCount,
            badgeAccent: "emerald",
          },
          {
            id: "chat",
            label: t("backoffice.inbox.tabs.chat"),
            testId: "backoffice-inbox-tab-chat",
            activeAccent: "blue",
            badge: s.chatThreadsNeedingReply,
            badgeAccent: "blue",
          },
          {
            id: "documents",
            label: t("backoffice.inbox.tabs.documents"),
            testId: "backoffice-inbox-tab-documents",
            activeAccent: "slate",
          },
        ]}
      />

      <BackOfficeInboxChatTab
        active={s.activeTab === "chat"}
        selectedChatInterventionId={s.selectedChatInterventionId}
        setSelectedChatInterventionId={s.setSelectedChatInterventionId}
        portalChatCompanyId={s.portalChatCompanyId}
        chatDayRows={s.chatDayRows}
        threadsNeedingReply={s.chatThreadsNeedingReplyIds}
        interventions={s.interventions}
        setActiveTab={s.setActiveTab}
      />

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          s.activeTab !== "documents" && "hidden"
        )}
        aria-hidden={s.activeTab !== "documents"}
        data-testid="backoffice-inbox-documents-panel"
      >
        <ChatbotDocumentsRightPanel />
      </div>

      <BackOfficeInboxListTab
        active={listTabActive}
        activeTab={s.activeTab === "reports" ? "reports" : "requests"}
        loading={s.loading}
        interventions={s.interventions}
        bridgedTerrainVisible={s.bridgedTerrainVisible}
        pendingRequests={s.pendingRequests}
        reportsNothingAtAll={s.reportsNothingAtAll}
        itemsToShow={s.itemsToShow}
        reportsArchivedList={s.reportsArchivedList}
        reportsArchiveExpanded={s.reportsArchiveExpanded}
        setReportsArchiveExpanded={s.setReportsArchiveExpanded}
        setSelectedItemId={s.setSelectedItemId}
        setSelectedTerrainLocalId={s.setSelectedTerrainLocalId}
      />

      <AnimatePresence>
        {s.selectedItem && (
          <InterventionDetailPanel
            selectedItem={s.selectedItem}
            interventions={s.interventions}
            cid={s.cid}
            pwaV2={s.pwaV2}
            resolvedAudioUrl={s.resolvedAudioUrl}
            isResolvingAudio={s.isResolvingAudio}
            audioStorageResolveFailed={s.audioStorageResolveFailed}
            selectedReportCompletion={s.selectedReportCompletion}
            isEditingDateTime={s.isEditingDateTime}
            setIsEditingDateTime={s.setIsEditingDateTime}
            editDate={s.editDate}
            setEditDate={s.setEditDate}
            editTime={s.editTime}
            setEditTime={s.setEditTime}
            editScheduleConflicts={s.editScheduleConflicts}
            intakeProposedSlots={s.intakeProposedSlots}
            intakeSlotsTitleKey={s.intakeSlotsTitleKey}
            assignPickerOpen={s.assignPickerOpen}
            setAssignPickerOpen={s.setAssignPickerOpen}
            isAssigning={s.isAssigning}
            onClose={() => s.setSelectedItemId(null)}
            onCancelIntervention={s.handleCancelIntervention}
            onVerify={s.handleVerify}
            onArchiveReport={s.handleArchiveReport}
            onReject={s.handleRejectReport}
            onAssign={s.handleAssignToTechnician}
            onDownloadQuotePdf={s.handleDownloadQuotePdf}
            onUpdateDateTime={s.handleUpdateDateTime}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {s.selectedTerrainLocalId
          ? (() => {
              const r = s.bridgedTerrainReports.find((x) => x.localId === s.selectedTerrainLocalId);
              if (!r) return null;
              return (
                <TerrainReportDetailPanel
                  report={r}
                  iv={s.terrainIv}
                  terrainBridge={s.terrainBridge}
                  terrainResolvedAudioUrl={s.terrainResolvedAudioUrl}
                  terrainAudioLoading={s.terrainAudioLoading}
                  terrainAudioFailed={s.terrainAudioFailed}
                  onClose={() => s.setSelectedTerrainLocalId(null)}
                  onVerify={s.handleVerify}
                  onArchiveReport={s.handleArchiveReport}
                  onReject={s.handleRejectReport}
                />
              );
            })()
          : null}
      </AnimatePresence>
    </div>
  );
}
