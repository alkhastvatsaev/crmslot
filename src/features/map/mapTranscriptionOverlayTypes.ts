import type { AiPlaybackSync } from "@/features/dispatch/components/AiAssistant";

export type MapTranscriptionAudiosResponse = {
  audio: null | {
    name: string;
    url: string;
    createdAt: string;
    transcript: string | null;
    meta?: unknown;
  };
  decision: { status: "none" | "refused" | "created"; updatedAt: string | null };
};

export type MapTranscriptionOverlayProps = {
  /** La transcription ne se charge et ne s’affiche qu’après l’appui sur lecture (Galaxy) */
  armed: boolean;
  /**
   * Incrémenté à chaque appui sur lecture (ex. `openEditSignal` côté carte) : ouvre tout de suite
   * le calque (assombrissement) avant la réponse `/api/ai/latest-audio`.
   */
  playOpenSignal?: number;
  /** Contrôlé par la carte : seul un appui sur le bouton lecture Galaxy le passe à `true` (pas l’auto-play). */
  transcriptTextEnabled?: boolean;
  /** Quand l’URL du clip correspond au transcript affiché et duration > 0, la révélation suit currentTime / duration */
  playbackSync?: AiPlaybackSync;
  /** Notifie si le calque transcription (texte + assombrissement) est affiché — ex. pour garder le bouton Play jusqu’à la croix */
  onVisibleChange?: (visible: boolean) => void;
  /** Si défini : n’utiliser que ce clip (URL /uploads/…), pas le « dernier fichier » disque — aligné sur la file Galaxy. */
  scopedClipPublicUrl?: string | null;
  /** Force l'affichage du calque (assombrissement et croix) même sans texte ou signal de lecture. */
  forceVisible?: boolean;
};
