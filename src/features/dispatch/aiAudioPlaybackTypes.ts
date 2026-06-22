import type { QueuedClip } from "@/features/dispatch/audioUtils";

export type AiPlaybackSync = {
  clipUrl: string;
  currentTime: number;
  duration: number;
  playing: boolean;
} | null;

export type UseAiAudioPlaybackOptions = {
  onUserPressPlay?: () => void;
  onPlaybackSync?: (sync: AiPlaybackSync) => void;
  onActiveClipUrlChange?: (clipPublicUrl: string | null) => void;
  onQueueChange?: (queue: QueuedClip[]) => void;
  /** Firestore + polling disque — désactiver hors page carte mobile. */
  backgroundTasksEnabled?: boolean;
};

export type UseAiAudioPlaybackReturn = {
  analyser: AnalyserNode | null;
  queue: QueuedClip[];
  isPlaying: boolean;
  startPlayback: () => void;
  stopPlayback: () => void;
};
