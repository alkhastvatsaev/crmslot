/**
 * API publique map — carte Mapbox, missions, transcription IA.
 * UI slot pager → `components/MapPageSlot.tsx`.
 */
export type { Mission } from "@/features/map/missionTypes";
export { missionStableKey } from "@/features/map/missionStableKey";
export {
  interventionHasMapCoordinates,
  isValidMissionCoordinates,
  missionTimeSortScore,
  interventionNumericId,
  buildMapHubMissions,
  computeMapKpiCounts,
} from "@/features/map/mapMissionTransforms";
export { useMapHubMissions } from "@/features/map/hooks/useMapHubMissions";
export type { GalaxyCreatedMission } from "@/features/map/GalaxyLayerBridgeContext";
export {
  GalaxyLayerBridgeProvider,
  useGalaxyLayerBridge,
  useGalaxyLayerBridgeOptional,
} from "@/features/map/GalaxyLayerBridgeContext";
export {
  TRANSCRIPT_REVEAL_MS_PER_CHAR,
  TRANSCRIPT_REVEAL_CHUNK_CHARS,
  TRANSCRIPT_POLL_MS,
  countWords,
  endIndexAfterWordCount,
  audioSyncedEndIndex,
  normalizeTranscriptionAudioUrl,
  computeTranscriptionShownText,
} from "@/features/map/mapTranscriptionReveal";
export type {
  MapTranscriptionDecisionStatus,
  MapTranscriptionLatestAudioResponse,
  MapTranscriptionFormState,
  MapTranscriptionCreatedMission,
} from "@/features/map/mapTranscriptionActionsTypes";
export {
  MAP_TRANSCRIPTION_PANEL_SHELL,
  formatMapTranscriptionClientName,
  normalizeMapTranscriptionTime,
  isMapTranscriptionFormValid,
  EMPTY_MAP_TRANSCRIPTION_FORM,
} from "@/features/map/mapTranscriptionActionsTypes";
export {
  extractSpokenFrenchHour,
  extractClientNameFromText,
  extractDateTimeFromText,
} from "@/features/map/components/transcriptionFormInference";
export {
  MAPBOX_GL_JS_VERSION,
  MAPBOX_CSP_WORKER_PATH,
  configureMapboxWebView,
} from "@/features/map/configureMapboxWebView";
export {
  MAPBOX_STYLE_SLUG_MOBILE,
  MAPBOX_STYLE_SLUG_DESKTOP,
  needsHttpsMapboxStyleUrl,
  resolveMapboxStyleSlug,
  resolveMapboxStyleUrl,
} from "@/features/map/mapboxStyleUrl";
export { resolveMapWebGLActive } from "@/features/map/mapMobileWebGLPolicy";
