import {
  isBackofficeReportInInboxActiveQueue,
  isBackofficeReportInInboxArchive,
} from "@/features/backoffice/backofficeReportsInboxArchive";
import type { BridgedTechnicianReport } from "@/context/TechnicianBackofficeReportBridgeContext";
import {
  coerceFirestoreLikeDate,
  isInterventionAwaitingTechnicianAcceptance,
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

/** Missions envoyées au technicien, en attente d’acceptation (onglet Rapports). */
export function computeAwaitingTechnicianAcceptance(interventions: Intervention[]): Intervention[] {
  return interventions
    .filter((inv) => isInterventionAwaitingTechnicianAcceptance(inv))
    .sort((a, b) => {
      const timeA = coerceFirestoreLikeDate(a.statusUpdatedAt ?? a.createdAt)?.getTime() ?? 0;
      const timeB = coerceFirestoreLikeDate(b.statusUpdatedAt ?? b.createdAt)?.getTime() ?? 0;
      return timeB - timeA;
    });
}

export function isInterventionInBackofficeReportsInboxQueue(
  iv: Pick<
    Intervention,
    "status" | "technicianAcceptedAt" | "backofficeReportsArchivedAt" | "technicianReportAmendedAt"
  >
): boolean {
  return isInterventionAwaitingTechnicianAcceptance(iv) || isBackofficeReportInInboxActiveQueue(iv);
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
  awaitingTechnicianAcceptance: Intervention[],
  reportsToValidateList: Intervention[],
  reportsArchivedList: Intervention[],
  bridgedTerrainCount: number
) {
  const reportsInboxList = [...awaitingTechnicianAcceptance, ...reportsToValidateList];
  const reportsTabBadgeCount =
    awaitingTechnicianAcceptance.length +
    reportsToValidateList.filter((iv) => iv.status === "done").length +
    bridgedTerrainCount;
  const reportsNothingAtAll =
    reportsInboxList.length === 0 && bridgedTerrainCount === 0 && reportsArchivedList.length === 0;
  const itemsToShow = activeTab === "requests" ? pendingRequests : reportsInboxList;
  return { reportsTabBadgeCount, reportsNothingAtAll, itemsToShow };
}
