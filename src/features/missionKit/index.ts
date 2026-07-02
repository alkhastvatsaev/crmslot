export type {
  BuildMissionKitInput,
  MissionKit,
  MissionKitChecklist,
  MissionKitItem,
  MissionKitItemSource,
  MissionKitItemStatus,
} from "@/features/missionKit/types";

export { buildMissionKit } from "@/features/missionKit/buildMissionKit";
export {
  buildHistoricalHint,
  extractHistoricalPatternItems,
  historicalPatternsToMissionKitItems,
  rankSimilarCompletedInterventions,
} from "@/features/missionKit/missionKitHistoricalPatterns";
export type { HistoricalPatternItem } from "@/features/missionKit/missionKitHistoricalPatterns";
export {
  matchMissionKitToStock,
  computeMissionKitCompletenessScore,
} from "@/features/missionKit/matchMissionKitToStock";
export type { MissionKitStockSnapshot } from "@/features/missionKit/matchMissionKitToStock";
export {
  matchMissionKitToLecot,
  matchMissionKitItemToCatalog,
  resolveMissionKitCatalog,
} from "@/features/missionKit/matchMissionKitToLecot";
export {
  enrichMissionKitWithAi,
  buildMissionKitAsync,
  applyMissionKitAiEnrichment,
  parseMissionKitAiResponse,
  aiItemsToMissionKitItems,
} from "@/features/missionKit/enrichMissionKitWithAi";
export type {
  MissionKitAiItem,
  MissionKitAiResponse,
} from "@/features/missionKit/enrichMissionKitWithAi";
export { default as MissionKitBadge } from "@/features/missionKit/components/MissionKitBadge";
export { useMissionKit } from "@/features/missionKit/hooks/useMissionKit";
export { default as MissionKitPanel } from "@/features/missionKit/components/MissionKitPanel";
export { useMissionKitChecklist } from "@/features/missionKit/hooks/useMissionKitChecklist";
export {
  buildMissionKitChecklistPatch,
  saveMissionKitChecklistToFirestore,
  shouldShowMissionKitMissingWarning,
} from "@/features/missionKit/missionKitChecklistFirestore";
export { useMissionKitMaterialOrder } from "@/features/missionKit/hooks/useMissionKitMaterialOrder";
export {
  missionKitItemToMaterialOrderPart,
  canOrderMissionKitItem,
} from "@/features/missionKit/missionKitItemToMaterialOrderPart";
export {
  computeMissionKitHubMetrics,
  filterInterventionsLast30d,
} from "@/features/missionKit/missionKitHubMetrics";
export type { MissionKitHubMetrics } from "@/features/missionKit/missionKitHubMetrics";
export { default as MissionKitHubKpiStrip } from "@/features/missionKit/components/MissionKitHubKpiStrip";
