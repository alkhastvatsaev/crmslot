export function readTranscription(inv: unknown): string | null {
  if (!inv || typeof inv !== "object") return null;
  const anyInv = inv as Record<string, unknown>;
  const candidates = [anyInv.transcription, anyInv.audioTranscription, anyInv.audio_transcription];
  const hit = candidates.find((v) => typeof v === "string" && v.trim().length > 0);
  return typeof hit === "string" ? hit : null;
}

export const QUICK_REJECT_REASON_KEYS = [
  "backoffice.inbox.reject_quick_photos",
  "backoffice.inbox.reject_quick_signature",
  "backoffice.inbox.reject_quick_description",
] as const;
