export const TRANSCRIPT_REVEAL_MS_PER_CHAR = 18;
/** Pas d’animation pour la révélation timer : un mot (ou un chunk de caractères si un seul token) à chaque pas. */
export const TRANSCRIPT_REVEAL_CHUNK_CHARS = 3;
export const TRANSCRIPT_POLL_MS =
  Number(process.env.NEXT_PUBLIC_TRANSCRIPT_POLL_MS) > 0
    ? Number(process.env.NEXT_PUBLIC_TRANSCRIPT_POLL_MS)
    : 3000;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Index dans `text` juste après le n-ième mot (espaces exclus du compte). */
export function endIndexAfterWordCount(text: string, wordCount: number): number {
  if (wordCount <= 0 || !text) return 0;
  let seen = 0;
  let i = 0;
  const len = text.length;
  while (i < len) {
    while (i < len && /\s/.test(text[i]!)) i++;
    if (i >= len) break;
    seen++;
    while (i < len && !/\s/.test(text[i]!)) i++;
    if (seen >= wordCount) return i;
  }
  return len;
}

/** Fin du segment à afficher, synchronisée sur `currentTime` / `duration` (mots si >1 mot, sinon caractères). */
export function audioSyncedEndIndex(text: string, currentTime: number, duration: number): number {
  if (!text || duration <= 0) return 0;
  const p = Math.min(1, Math.max(0, currentTime / duration));
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  if (words.length === 1) {
    return Math.min(text.length, Math.floor(text.length * p));
  }
  const n = Math.min(words.length, Math.floor(p * words.length));
  return endIndexAfterWordCount(text, n);
}

export function normalizeTranscriptionAudioUrl(url: string): string {
  if (typeof window === "undefined") return url.trim();
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url.trim();
  }
}

export function computeTranscriptionShownText(params: {
  fullText: string;
  audioSyncActive: boolean;
  audioDrivenEndIndex: number;
  fallbackRevealedLen: number;
  fallbackRevealedWordCount: number;
}): string {
  const {
    fullText,
    audioSyncActive,
    audioDrivenEndIndex,
    fallbackRevealedLen,
    fallbackRevealedWordCount,
  } = params;
  if (!fullText.length) return "";

  const tw = countWords(fullText);
  const fallbackDisplayedEnd =
    tw <= 1 ? fallbackRevealedLen : endIndexAfterWordCount(fullText, fallbackRevealedWordCount);

  const shownLen = audioSyncActive
    ? Math.max(audioDrivenEndIndex, fallbackDisplayedEnd)
    : fallbackDisplayedEnd;

  return fullText.slice(0, shownLen);
}
