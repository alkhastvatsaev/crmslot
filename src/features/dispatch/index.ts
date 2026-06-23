/**
 * API publique dispatch — assignation techniciens, ranking IA et audio MacroDroid.
 */
export { default as TechnicianAssignPicker } from "@/features/dispatch/components/TechnicianAssignPicker";
export { default as AiAssistant } from "@/features/dispatch/components/AiAssistant";
export type { AiPlaybackSync } from "@/features/dispatch/components/AiAssistant";
export {
  rankTechniciansForIntervention,
  haversineDistanceKm,
} from "@/features/dispatch/rankTechniciansForIntervention";
export type { RankedTechnician } from "@/features/dispatch/rankTechniciansForIntervention";
export {
  resolveTechnicianAssignUid,
  canResolveTechnicianAssignUid,
} from "@/features/dispatch/technicianAssignUid";
export { useAiAudioPlayback } from "@/features/dispatch/hooks/useAiAudioPlayback";
export type {
  UseAiAudioPlaybackOptions,
  UseAiAudioPlaybackReturn,
} from "@/features/dispatch/hooks/useAiAudioPlayback";
