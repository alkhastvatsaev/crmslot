import type { Intervention } from "@/features/interventions";

export function readTerrainReportTranscription(inv: unknown): string | null {
  if (!inv || typeof inv !== "object") return null;
  const anyInv = inv as Record<string, unknown>;
  const candidates = [anyInv.transcription, anyInv.audioTranscription, anyInv.audio_transcription];
  const hit = candidates.find((v) => typeof v === "string" && v.trim().length > 0);
  return typeof hit === "string" ? hit : null;
}

export type TerrainReportDetailPanelProps = {
  report: import("@/context/TechnicianBackofficeReportBridgeContext").BridgedTechnicianReport;
  iv: Intervention | null;
  terrainBridge:
    | import("@/context/TechnicianBackofficeReportBridgeContext").TechnicianBackofficeReportBridgeApi
    | null;
  terrainResolvedAudioUrl: string | null;
  terrainAudioLoading: boolean;
  terrainAudioFailed: boolean;
  onClose: () => void;
  onVerify: (id: string) => void;
  onArchiveReport: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
};
