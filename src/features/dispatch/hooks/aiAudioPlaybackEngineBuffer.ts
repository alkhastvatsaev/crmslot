import { logger } from "@/core/logger";
import type { AiPlaybackSyncApi } from "@/features/dispatch/hooks/useAiAudioPlaybackSync";
import type { AiAudioBufferMeta } from "@/features/dispatch/hooks/aiAudioPlaybackEngineTypes";

export function stopBufferPlayback(
  bufferSourceRef: React.MutableRefObject<AudioBufferSourceNode | null>,
  bufferMetaRef: React.MutableRefObject<AiAudioBufferMeta | null>
): void {
  if (bufferSourceRef.current) {
    try {
      bufferSourceRef.current.stop(0);
    } catch {
      /* déjà stoppé */
    }
    bufferSourceRef.current = null;
  }
  bufferMetaRef.current = null;
}

type PlayDecodedBufferParams = {
  ab: ArrayBuffer;
  syncClipUrl: string;
  session: number;
  playSessionRef: React.MutableRefObject<number>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  bufferSourceRef: React.MutableRefObject<AudioBufferSourceNode | null>;
  bufferMetaRef: React.MutableRefObject<AiAudioBufferMeta | null>;
  setAnalyser: React.Dispatch<React.SetStateAction<AnalyserNode | null>>;
  sync: AiPlaybackSyncApi;
  onEnded: () => void;
};

export async function playDecodedBuffer(params: PlayDecodedBufferParams): Promise<void> {
  const ctx = params.audioContextRef.current;
  if (!ctx) throw new Error("AudioContext indisponible");
  await ctx.resume();
  stopBufferPlayback(params.bufferSourceRef, params.bufferMetaRef);
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(params.ab.slice(0));
  } catch (e) {
    logger.error("decodeAudioData:", { error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  const analyserNode = ctx.createAnalyser();
  analyserNode.fftSize = 256;
  analyserNode.smoothingTimeConstant = 0.8;
  source.connect(analyserNode);
  analyserNode.connect(ctx.destination);
  params.setAnalyser(analyserNode);
  params.bufferSourceRef.current = source;
  params.bufferMetaRef.current = {
    startCtxTime: ctx.currentTime,
    duration: audioBuffer.duration,
    clipUrl: params.syncClipUrl,
  };
  source.onended = () => {
    if (params.session !== params.playSessionRef.current) return;
    params.sync.cancelPlaybackSyncRafRef.current();
    params.sync.flushPlaybackSyncRef.current();
    params.onEnded();
  };
  source.start(0);
  params.sync.schedulePlaybackSyncRafRef.current();
}
