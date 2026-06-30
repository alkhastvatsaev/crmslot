"use client";

import { ClipboardList, ChevronDown, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { useTranslation } from "@/core/i18n/I18nContext";
import BackOfficeBridgedTerrainReportCard from "@/features/backoffice/components/BackOfficeBridgedTerrainReportCard";
import { BackOfficeInboxInterventionRow } from "@/features/backoffice/components/BackOfficeInboxInterventionRow";
import type { Intervention } from "@/features/interventions";
import type { BridgedTechnicianReport } from "@/context/TechnicianBackofficeReportBridgeContext";

export default function BackOfficeInboxListTab({
  active,
  activeTab,
  loading,
  interventions,
  bridgedTerrainVisible,
  pendingRequests,
  reportsNothingAtAll,
  itemsToShow,
  reportsArchivedList,
  reportsArchiveExpanded,
  setReportsArchiveExpanded,
  setSelectedItemId,
  setSelectedTerrainLocalId,
}: {
  active: boolean;
  activeTab: "requests" | "reports";
  loading: boolean;
  interventions: Intervention[];
  bridgedTerrainVisible: BridgedTechnicianReport[];
  pendingRequests: Intervention[];
  reportsNothingAtAll: boolean;
  itemsToShow: Intervention[];
  reportsArchivedList: Intervention[];
  reportsArchiveExpanded: boolean;
  setReportsArchiveExpanded: (fn: (v: boolean) => boolean) => void;
  setSelectedItemId: (id: string | null) => void;
  setSelectedTerrainLocalId: (id: string | null) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        GLASS_PANEL_BODY_SCROLL_COMPACT,
        "flex min-h-0 flex-1 flex-col gap-2 px-4 pb-6",
        !active && "hidden"
      )}
      aria-hidden={!active}
    >
      {activeTab === "reports" &&
        bridgedTerrainVisible.map((r) => (
          <BackOfficeBridgedTerrainReportCard
            key={r.localId}
            r={r}
            interventions={interventions}
            onSelect={setSelectedTerrainLocalId}
          />
        ))}

      {loading ? (
        <div className="space-y-2 py-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-[16px] bg-white/50 border border-slate-200/50"
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
        <div className="grid grid-cols-1 gap-2">
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
  );
}
