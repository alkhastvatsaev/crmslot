/**
 * API publique offline — sync terrain PWA, queue IndexedDB clôtures.
 */
export type { CompletionQueueRecord } from "@/features/offline/completionQueueDb";
export {
  completionQueuePut,
  completionQueueDelete,
  completionQueueGetAll,
  completionQueueCount,
} from "@/features/offline/completionQueueDb";
export {
  finalizeCompletionOfflineAware,
  enqueueCompletionRecord,
  flushCompletionQueue,
  getCompletionQueueLength,
  subscribeCompletionQueueChanged,
  notifyCompletionQueueChanged,
} from "@/features/offline/completionSync";
export type { FlushCompletionReport } from "@/features/offline/completionSync";
export { remoteCompletionIsNewerThanQueued } from "@/features/offline/completionConflict";
export { nextRetryAfter, isRetryDue } from "@/features/offline/completionRetryBackoff";
export {
  bridgedReportsPut,
  bridgedReportsDelete,
  bridgedReportsGetAll,
  bridgedReportsDeleteForIntervention,
} from "@/features/offline/bridgedReportsDb";
export { TECHNICIAN_ASSIGNMENTS_QUERY_KEY } from "@/features/offline/technicianQueryKeys";
export { TechnicianQueryProvider } from "@/features/offline/TechnicianQueryProvider";
export { OFFLINE_HUB_SLOT_INDEX } from "@/features/offline/offlineHubConstants";
export { OFFLINE_SYNC_SLOT_INDEX } from "@/features/offline/offlineSyncConstants";
export {
  navigateOfflineHub,
  OFFLINE_HUB_ANCHOR_SYNC,
  OFFLINE_HUB_ANCHOR_CACHE,
} from "@/features/offline/offlineHubNavigation";
export {
  readTerrainMissionsCache,
  writeTerrainMissionsCache,
} from "@/features/offline/terrainMissionsCache";
export type { TerrainMissionCacheRow } from "@/features/offline/terrainMissionsCache";
export {
  readAdminInboxInterventionsCache,
  writeAdminInboxInterventionsCache,
  splitInterventionsByCompanyIds,
} from "@/features/offline/adminInboxInterventionsCache";
