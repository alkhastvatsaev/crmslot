import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import {
  isRecoverablePlaybackError,
  mimeFromAudioUrl,
  uploadPathCandidatesFromUrl,
  waitForCanPlay,
} from "@/features/dispatch/audioUtils";
import type { QueuedClip } from "@/features/dispatch/audioUtils";

export async function tryPlayMediaElement(mediaEl: HTMLAudioElement): Promise<boolean> {
  await waitForCanPlay(mediaEl, 900);
  try {
    await mediaEl.play();
    return true;
  } catch (err) {
    if (isRecoverablePlaybackError(err)) return false;
    throw err;
  }
}

export async function fetchClipArrayBuffer(
  absResolved: string,
  clip: QueuedClip
): Promise<ArrayBuffer> {
  const tryDownload = async (href: string) => {
    const res = await fetch(href, { cache: "no-store" });
    if (!res.ok) return null;
    return res.arrayBuffer();
  };

  let ab = await tryDownload(absResolved);
  if (!ab && typeof window !== "undefined") {
    for (const name of uploadPathCandidatesFromUrl(clip.url, window.location.origin)) {
      const res = await fetchWithAuth(
        `/api/ai/resolve-audio-url?name=${encodeURIComponent(name)}`,
        { cache: "no-store" }
      );
      if (!res.ok) continue;
      const j = (await res.json()) as { url?: string };
      if (!j?.url) continue;
      const nextAbs = new URL(j.url, window.location.origin).href;
      ab = await tryDownload(nextAbs);
      if (ab) break;
    }
  }
  if (!ab) throw new Error(`Téléchargement audio: 404`);
  return ab;
}

export function clipBlobFromBuffer(ab: ArrayBuffer, effectiveUrl: string): Blob {
  const mime = mimeFromAudioUrl(effectiveUrl);
  return new Blob([ab], { type: mime });
}
