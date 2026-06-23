import {
  isBackofficeReportInInboxActiveQueue,
  isBackofficeReportInInboxArchive,
} from "@/features/backoffice/backofficeReportsInboxArchive";
import type { BridgedTechnicianReport } from "@/context/TechnicianBackofficeReportBridgeContext";
import {
  coerceFirestoreLikeDate,
  isInterventionInBackofficeRequestsQueue,
} from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions";
import type { BackOfficeInboxTab } from "@/features/backoffice/backOfficeInboxTypes";

export function computePendingRequests(interventions: Intervention[]): Intervention[] {
  return interventions
    .filter((inv) => isInterventionInBackofficeRequestsQueue(inv))
    .sort((a, b) => {
      const timeA = coerceFirestoreLikeDate(a.createdAt)?.getTime() ?? 0;
      const timeB = coerceFirestoreLikeDate(b.createdAt)?.getTime() ?? 0;
      return timeB - timeA;
    });
}

export function computeValidationReports(interventions: Intervention[]): Intervention[] {
  return interventions
    .filter((inv) => inv.status === "done" || inv.status === "invoiced")
    .sort((a, b) => {
      const timeA = coerceFirestoreLikeDate(a.completedAt)?.getTime() ?? 0;
      const timeB = coerceFirestoreLikeDate(b.completedAt)?.getTime() ?? 0;
      return timeB - timeA;
    });
}

export function computeBridgedTerrainVisible(
  bridgedTerrainReports: BridgedTechnicianReport[],
  reportsToValidateList: Intervention[]
): BridgedTechnicianReport[] {
  const syncedIds = new Set(reportsToValidateList.map((iv) => iv.id));
  return bridgedTerrainReports.filter((r) => !syncedIds.has(r.interventionId));
}

export function computeInboxListMetrics(
  activeTab: BackOfficeInboxTab,
  pendingRequests: Intervention[],
  reportsToValidateList: Intervention[],
  reportsArchivedList: Intervention[],
  bridgedTerrainCount: number
) {
  const reportsTabBadgeCount =
    reportsToValidateList.filter((iv) => iv.status === "done").length + bridgedTerrainCount;
  const reportsNothingAtAll =
    reportsToValidateList.length === 0 &&
    bridgedTerrainCount === 0 &&
    reportsArchivedList.length === 0;
  const itemsToShow = activeTab === "requests" ? pendingRequests : reportsToValidateList;
  return { reportsTabBadgeCount, reportsNothingAtAll, itemsToShow };
}
