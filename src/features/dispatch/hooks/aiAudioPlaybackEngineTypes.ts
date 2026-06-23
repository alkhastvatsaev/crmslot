import type { AiPlaybackSyncApi } from "@/features/dispatch/hooks/useAiAudioPlaybackSync";
import type { QueuedClip } from "@/features/dispatch/audioUtils";

export type AiAudioBufferMeta = {
  startCtxTime: number;
  duration: number;
  clipUrl: string;
};

export type AiAudioPlaybackEngineRefs = {
  queueRef: React.MutableRefObject<QueuedClip[]>;
  pausedByUserRef: React.MutableRefObject<boolean>;
  pendingPlayRef: React.MutableRefObject<boolean>;
  mountedRef: React.MutableRefObject<boolean>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  objectUrlRef: React.MutableRefObject<string | null>;
  bufferSourceRef: React.MutableRefObject<AudioBufferSourceNode | null>;
  bufferMetaRef: React.MutableRefObject<AiAudioBufferMeta | null>;
  playSessionRef: React.MutableRefObject<number>;
};

export type AiAudioPlaybackEngineSetters = {
  setQueue: React.Dispatch<React.SetStateAction<QueuedClip[]>>;
  setAnalyser: React.Dispatch<React.SetStateAction<AnalyserNode | null>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
};

export type AiAudioPlaybackEngineDeps = AiAudioPlaybackEngineRefs &
  AiAudioPlaybackEngineSetters & {
    sync: AiPlaybackSyncApi;
  };
