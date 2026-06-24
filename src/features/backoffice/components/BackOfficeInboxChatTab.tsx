"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { capitalizeName } from "@/utils/stringUtils";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { useTranslation } from "@/core/i18n/I18nContext";
import CompanyChatPanel from "@/features/backoffice/components/CompanyChatPanel";
import ChatDayClientsPicker from "@/features/backoffice/components/ChatDayClientsPicker";
import { interventionClientLabel } from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions";
import type { ChatDayMissionRow } from "@/features/backoffice/chatDayMissionRow";
import {
  PORTAL_CHAT_GLOBAL_THREAD_ID,
  isPortalChatSenderThreadId,
} from "@/features/backoffice/portalChatInboxLogic";

export default function BackOfficeInboxChatTab({
  active,
  selectedChatInterventionId,
  setSelectedChatInterventionId,
  portalChatCompanyId,
  chatDayRows,
  interventions,
  setActiveTab,
}: {
  active: boolean;
  selectedChatInterventionId: string | null;
  setSelectedChatInterventionId: (id: string | null) => void;
  portalChatCompanyId: string | null;
  chatDayRows: ChatDayMissionRow[];
  interventions: Intervention[];
  setActiveTab: (tab: "chat" | "requests" | "reports" | "documents") => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/50",
        !active && "hidden"
      )}
      aria-hidden={!active}
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
                  if (selectedChatInterventionId === PORTAL_CHAT_GLOBAL_THREAD_ID) {
                    return t("chat.global_chat_title");
                  }
                  const row = chatDayRows.find((r) => r.threadId === selectedChatInterventionId);
                  if (row?.clientName.trim()) return capitalizeName(row.clientName);
                  if (isPortalChatSenderThreadId(selectedChatInterventionId)) {
                    return t("chat.anonymous_client");
                  }
                  const iv = interventions.find((x) => x.id === selectedChatInterventionId);
                  const label = iv ? interventionClientLabel(iv) : "";
                  return label ? capitalizeName(label) : t("chat.anonymous_client");
                })()}
              </span>
              {selectedChatInterventionId !== PORTAL_CHAT_GLOBAL_THREAD_ID &&
              !isPortalChatSenderThreadId(selectedChatInterventionId) ? (
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
          <CompanyChatPanel
            className="min-h-0 flex-1 px-0"
            acceptPortalMessages
            chatCompanyId={portalChatCompanyId}
            chatInterventionId={
              selectedChatInterventionId === PORTAL_CHAT_GLOBAL_THREAD_ID
                ? null
                : selectedChatInterventionId
            }
            onRemoteClientMessage={portalChatCompanyId ? () => setActiveTab("chat") : undefined}
          />
        </div>
      ) : (
        <ChatDayClientsPicker
          className={cn(GLASS_PANEL_BODY_SCROLL_COMPACT, "py-4 px-1")}
          rows={chatDayRows}
          selectedThreadId={selectedChatInterventionId}
          onSelectGlobal={() => setSelectedChatInterventionId(PORTAL_CHAT_GLOBAL_THREAD_ID)}
          onSelectClient={(threadId) => setSelectedChatInterventionId(threadId)}
        />
      )}
    </div>
  );
}
