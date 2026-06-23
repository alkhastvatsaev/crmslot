import { logger } from "@/core/logger";
import { isRecoverablePlaybackError } from "@/features/dispatch/audioUtils";
import type { AiPlaybackSyncApi } from "@/features/dispatch/hooks/useAiAudioPlaybackSync";

export async function ensureAudioGraph(
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  sync: AiPlaybackSyncApi
): Promise<AnalyserNode | null> {
  if (!audioContextRef.current) {
    const MaybeWebkit = (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext;
    const Ctx =
      window.AudioContext ??
      (typeof MaybeWebkit === "function" ? (MaybeWebkit as typeof AudioContext) : undefined);
    if (!Ctx) {
      logger.error("AudioContext indisponible dans ce navigateur");
      return null;
    }
    audioContextRef.current = new Ctx();
  }
  if (audioContextRef.current.state === "suspended") {
    try {
      await audioContextRef.current.resume();
    } catch (err) {
      if (isRecoverablePlaybackError(err)) return null;
      throw err;
    }
  }
  if (!audioRef.current) {
    audioRef.current = new Audio();
    const elHook = audioRef.current;
    elHook.setAttribute("playsinline", "");
    elHook.setAttribute("webkit-playsinline", "");
    elHook.preload = "auto";
    elHook.crossOrigin = "anonymous";
    elHook.addEventListener("loadedmetadata", () => sync.flushPlaybackSyncRef.current());
    elHook.addEventListener("play", () => sync.schedulePlaybackSyncRafRef.current());
    elHook.addEventListener("pause", () => {
      sync.cancelPlaybackSyncRafRef.current();
      sync.flushPlaybackSyncRef.current();
    });
    elHook.addEventListener("ended", () => {
      sync.cancelPlaybackSyncRafRef.current();
      sync.flushPlaybackSyncRef.current();
    });
    const source = audioContextRef.current.createMediaElementSource(audioRef.current);
    const analyserNode = audioContextRef.current.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.8;
    source.connect(analyserNode);
    analyserNode.connect(audioContextRef.current.destination);
    (audioRef.current as unknown as { __analyser: AnalyserNode }).__analyser = analyserNode;
  }
  return (audioRef.current as unknown as { __analyser: AnalyserNode }).__analyser;
}
