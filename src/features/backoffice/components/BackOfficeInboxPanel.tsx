"use client";

import {
  ClipboardList,
  FileCheck,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { HUB_FONT_OUTFIT, HUB_SURFACE, HubSegmentedControl } from "@/core/ui/hub";
import { cn } from "@/lib/utils";
import { capitalizeName } from "@/utils/stringUtils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Mission } from "@/features/map/missionTypes";
import type { BridgedTechnicianReport } from "@/context/TechnicianBackofficeReportBridgeContext";
import type { Intervention } from "@/features/interventions/types";
import IvanaClientChatPanel from "@/features/backoffice/components/IvanaClientChatPanel";
import ChatDayClientsPicker from "@/features/backoffice/components/ChatDayClientsPicker";
import ChatbotDocumentsRightPanel from "@/features/chatbot/components/ChatbotDocumentsRightPanel";
import ScheduleDragBoard from "@/features/scheduling/components/ScheduleDragBoard";
import { interventionClientLabel } from "@/features/interventions/technicianSchedule";
import { useBackOfficeInboxState } from "@/features/backoffice/hooks/useBackOfficeInboxState";
import { BackOfficeInboxInterventionRow } from "@/features/backoffice/components/BackOfficeInboxInterventionRow";
import InterventionDetailPanel from "@/features/backoffice/components/InterventionDetailPanel";
import TerrainReportDetailPanel from "@/features/backoffice/components/TerrainReportDetailPanel";

/** Card row for a bridged terrain report (not yet synced to Firestore). */
function BridgedTerrainReportCard({
  r,
  interventions,
  onSelect,
}: {
  r: BridgedTechnicianReport;
  interventions: Intervention[];
  onSelect: (localId: string) => void;
}) {
  const { t } = useTranslation();
  const iv = interventions.find((x) => x.id === r.interventionId);
  const nameRaw =
    `${iv?.clientFirstName ?? ""} ${iv?.clientLastName ?? ""}`.trim() || (iv?.clientName ?? "");
  const displayName = nameRaw ? capitalizeName(nameRaw) : `Client · …${r.interventionId.slice(-8)}`;
  const description =
    iv?.problem ||
    iv?.title ||
    `${String(t("backoffice.inbox.terrain_report"))} (${String(t("backoffice.inbox.photos"))} + ${String(t("backoffice.inbox.signature_client"))})`;
  const addressShort = (iv?.address ?? "").split(",")[0] || (iv?.address ? iv.address : "");
  const time = new Date(r.receivedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      data-testid="backoffice-bridged-report"
      onClick={() => onSelect(r.localId)}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="group relative cursor-pointer overflow-hidden rounded-[24px] border bg-white p-4 transition-all duration-300 hover:shadow-lg border-emerald-100 bg-emerald-50/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h4 className="text-[15px] font-bold text-slate-800 truncate">{displayName}</h4>
          </div>
          <p className="text-[13px] font-bold text-slate-700 truncate mb-2">{description}</p>
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {time}
            </span>
            {addressShort ? <span className="truncate max-w-[140px]">{addressShort}</span> : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight bg-emerald-100 text-emerald-700">
            {String(t("backoffice.inbox.tag_report"))}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}

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
  const {
    cid,
    isTenant,
    workspaceReady,
    ivanaChatCompanyId,
    pwaV2,
    interventions,
    loading,
    terrainBridge,
    bridgedTerrainReports,
    activeTab,
    setActiveTab,
    dragBoardTechUid,
    setDragBoardTechUid,
    dragBoardDate,
    setDragBoardDate,
    selectedItem,
    setSelectedItemId,
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
    reportsArchiveExpanded,
    setReportsArchiveExpanded,
    assignPickerOpen,
    setAssignPickerOpen,
    isAssigning,
    selectedTerrainLocalId,
    setSelectedTerrainLocalId,
    terrainIv,
    terrainResolvedAudioUrl,
    terrainAudioLoading,
    terrainAudioFailed,
    resolvedAudioUrl,
    isResolvingAudio,
    audioStorageResolveFailed,
    pendingRequests,
    reportsArchivedList,
    bridgedTerrainVisible,
    reportsTabBadgeCount,
    reportsNothingAtAll,
    itemsToShow,
    selectedReportCompletion,
    handleAssignToTechnician,
    handleCancelIntervention,
    handleVerify,
    handleArchiveReport,
    handleRejectReport,
    handleDragBoardSchedule,
    handleUpdateDateTime,
    handleDownloadQuotePdf,
  } = useBackOfficeInboxState(dayMissions, { inboxDataActive });

  if (!isTenant) {
    if (!workspaceReady) {
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
        <IvanaClientChatPanel
          className="min-h-0"
          acceptPortalMessages
          chatCompanyId={ivanaChatCompanyId}
        />
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
      {pwaV2 && activeTab === "requests" ? (
        <div className="mx-4 mt-2">
          <ScheduleDragBoard
            interventions={interventions}
            technicianUid={dragBoardTechUid}
            onTechnicianChange={setDragBoardTechUid}
            dateYmd={dragBoardDate}
            onDateChange={setDragBoardDate}
            onSchedule={(id, time) => void handleDragBoardSchedule(id, time)}
          />
        </div>
      ) : null}

      <HubSegmentedControl
        value={activeTab}
        onChange={(id) => setActiveTab(id as "chat" | "requests" | "reports" | "documents")}
        className="mx-4 my-4 shrink-0"
        options={[
          {
            id: "requests",
            label: t("backoffice.inbox.tabs.requests"),
            testId: "backoffice-inbox-tab-requests",
            activeAccent: "blue",
            badge: pendingRequests.length,
            badgeAccent: "blue",
          },
          {
            id: "reports",
            label: t("backoffice.inbox.tabs.reports"),
            testId: "backoffice-inbox-tab-reports",
            activeAccent: "emerald",
            badge: reportsTabBadgeCount,
            badgeAccent: "emerald",
          },
          {
            id: "chat",
            label: t("backoffice.inbox.tabs.chat"),
            testId: "backoffice-inbox-tab-chat",
            activeAccent: "blue",
            badge: chatThreadsNeedingReply,
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

      {/* Chat Tab */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/50",
          activeTab !== "chat" && "hidden"
        )}
        aria-hidden={activeTab !== "chat"}
      >
        {selectedChatInterventionId ? (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shrink-0 shadow-sm z-10">
              <button
                onClick={() => setSelectedChatInterventionId(null)}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
                title={String(t("chat.back_to_list"))}
                aria-label={String(t("chat.back_to_list"))}
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <div className="flex flex-col min-w-0 flex-1 items-center justify-center text-center pr-8">
                <span className="text-[14px] font-bold text-slate-800 truncate w-full text-center">
                  {(() => {
                    if (selectedChatInterventionId === "global") return t("chat.global_chat_title");
                    const row = chatDayRows.find((r) => r.threadId === selectedChatInterventionId);
                    if (row?.clientName.trim()) return capitalizeName(row.clientName);
                    const iv = interventions.find((x) => x.id === selectedChatInterventionId);
                    const label = iv ? interventionClientLabel(iv) : "";
                    return label ? capitalizeName(label) : t("chat.anonymous_client");
                  })()}
                </span>
                {selectedChatInterventionId !== "global" ? (
                  <span className="text-[11px] text-slate-500 truncate font-medium w-full text-center">
                    {chatDayRows
                      .find((r) => r.threadId === selectedChatInterventionId)
                      ?.address?.trim() ||
                      interventions.find((x) => x.id === selectedChatInterventionId)?.address ||
                      ""}
                  </span>
                ) : null}
              </div>
            </div>
            <IvanaClientChatPanel
              className="min-h-0 flex-1 px-0"
              acceptPortalMessages
              chatCompanyId={ivanaChatCompanyId}
              chatInterventionId={
                selectedChatInterventionId === "global" ? null : selectedChatInterventionId
              }
              onRemoteClientMessage={ivanaChatCompanyId ? () => setActiveTab("chat") : undefined}
            />
          </div>
        ) : (
          <ChatDayClientsPicker
            className={cn(GLASS_PANEL_BODY_SCROLL_COMPACT, "py-4 px-1")}
            rows={chatDayRows}
            selectedThreadId={selectedChatInterventionId}
            onSelectGlobal={() => setSelectedChatInterventionId("global")}
            onSelectClient={(threadId) => setSelectedChatInterventionId(threadId)}
          />
        )}
      </div>

      {/* Documents Tab */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          activeTab !== "documents" && "hidden"
        )}
        aria-hidden={activeTab !== "documents"}
        data-testid="backoffice-inbox-documents-panel"
      >
        <ChatbotDocumentsRightPanel />
      </div>

      {/* Requests / Reports list */}
      <div
        className={cn(
          GLASS_PANEL_BODY_SCROLL_COMPACT,
          "flex min-h-0 flex-1 flex-col gap-3 px-4 pb-6",
          (activeTab === "chat" || activeTab === "documents") && "hidden"
        )}
        aria-hidden={activeTab === "chat" || activeTab === "documents"}
      >
        {activeTab === "reports" &&
          bridgedTerrainVisible.map((r) => (
            <BridgedTerrainReportCard
              key={r.localId}
              r={r}
              interventions={interventions}
              onSelect={setSelectedTerrainLocalId}
            />
          ))}

        {loading ? (
          <div className="space-y-3 py-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-[24px] bg-white/50 border border-slate-200/50"
              />
            ))}
          </div>
        ) : null}

        {!loading &&
        ((activeTab === "requests" && pendingRequests.length === 0) ||
          (activeTab === "reports" && reportsNothingAtAll)) ? (
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              {activeTab === "requests" ? (
                <ClipboardList className="h-8 w-8 text-slate-300" />
              ) : (
                <FileCheck className="h-8 w-8 text-slate-300" />
              )}
            </div>
            <p className="text-sm text-slate-500 font-medium">
              {activeTab === "requests"
                ? t("backoffice.inbox.empty_requests")
                : t("backoffice.inbox.empty_reports")}
            </p>
          </div>
        ) : null}

        {!loading && itemsToShow.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {itemsToShow.map((item, index) => (
              <BackOfficeInboxInterventionRow
                key={item.id}
                item={item}
                index={index}
                variant={activeTab === "requests" ? "request" : "report-active"}
                onSelect={setSelectedItemId}
              />
            ))}
          </div>
        ) : null}

        {!loading && activeTab === "reports" && reportsArchivedList.length > 0 ? (
          <div
            className="mt-1 shrink-0 border-t border-slate-200/50 pt-1"
            data-testid="backoffice-reports-archive-section"
          >
            <button
              type="button"
              data-testid="backoffice-reports-archive-toggle"
              aria-expanded={reportsArchiveExpanded}
              onClick={() => setReportsArchiveExpanded((v) => !v)}
              className="flex w-full items-center justify-center gap-1 rounded-[10px] py-2 px-2 text-[11px] font-medium text-slate-400 transition-colors hover:bg-slate-100/70 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/60"
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200",
                  reportsArchiveExpanded && "rotate-180"
                )}
                aria-hidden
              />
              <span>
                Archive · {reportsArchivedList.length} validé
                {reportsArchivedList.length > 1 ? "s" : ""}
              </span>
            </button>
            {reportsArchiveExpanded ? (
              <div
                className="grid grid-cols-1 gap-3 pt-2"
                data-testid="backoffice-reports-archive-list"
              >
                {reportsArchivedList.map((item, index) => (
                  <BackOfficeInboxInterventionRow
                    key={item.id}
                    item={item}
                    index={index}
                    variant="report-archived"
                    onSelect={setSelectedItemId}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Intervention detail slide-over */}
      <AnimatePresence>
        {selectedItem && (
          <InterventionDetailPanel
            selectedItem={selectedItem}
            interventions={interventions}
            cid={cid}
            pwaV2={pwaV2}
            resolvedAudioUrl={resolvedAudioUrl}
            isResolvingAudio={isResolvingAudio}
            audioStorageResolveFailed={audioStorageResolveFailed}
            selectedReportCompletion={selectedReportCompletion}
            isEditingDateTime={isEditingDateTime}
            setIsEditingDateTime={setIsEditingDateTime}
            editDate={editDate}
            setEditDate={setEditDate}
            editTime={editTime}
            setEditTime={setEditTime}
            editScheduleConflicts={editScheduleConflicts}
            intakeProposedSlots={intakeProposedSlots}
            intakeSlotsTitleKey={intakeSlotsTitleKey}
            assignPickerOpen={assignPickerOpen}
            setAssignPickerOpen={setAssignPickerOpen}
            isAssigning={isAssigning}
            onClose={() => setSelectedItemId(null)}
            onCancelIntervention={handleCancelIntervention}
            onVerify={handleVerify}
            onArchiveReport={handleArchiveReport}
            onReject={handleRejectReport}
            onAssign={handleAssignToTechnician}
            onDownloadQuotePdf={handleDownloadQuotePdf}
            onUpdateDateTime={handleUpdateDateTime}
          />
        )}
      </AnimatePresence>

      {/* Terrain report slide-over */}
      <AnimatePresence>
        {selectedTerrainLocalId
          ? (() => {
              const r = bridgedTerrainReports.find((x) => x.localId === selectedTerrainLocalId);
              if (!r) return null;
              return (
                <TerrainReportDetailPanel
                  report={r}
                  iv={terrainIv}
                  terrainBridge={terrainBridge}
                  terrainResolvedAudioUrl={terrainResolvedAudioUrl}
                  terrainAudioLoading={terrainAudioLoading}
                  terrainAudioFailed={terrainAudioFailed}
                  onClose={() => setSelectedTerrainLocalId(null)}
                  onVerify={handleVerify}
                  onArchiveReport={handleArchiveReport}
                  onReject={handleRejectReport}
                />
              );
            })()
          : null}
      </AnimatePresence>
    </div>
  );
}
