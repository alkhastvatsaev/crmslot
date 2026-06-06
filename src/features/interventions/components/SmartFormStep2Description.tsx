"use client";

import { logger } from "@/core/logger";

import React, { useEffect, useRef, useState } from "react";
import { Download, Mic, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// AudioPlayer (internal to this step — only used here)
// ---------------------------------------------------------------------------

const AudioPlayer = ({ blob, onRemove }: { blob: Blob; onRemove: () => void }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!(blob instanceof Blob)) return;
    let url = "";
    try {
      url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
      }
    } catch (e) {
      logger.error("Failed to create object URL:", {
        error: e instanceof Error ? e.message : String(e),
      });
      const reader = new FileReader();
      reader.onload = () => {
        if (audioRef.current) {
          audioRef.current.src = reader.result as string;
        }
      };
      reader.readAsDataURL(blob);
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [blob]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      void audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const downloadBlob = () => {
    try {
      const mime = blob.type || "audio/webm";
      const ext = mime.includes("mp4")
        ? "m4a"
        : mime.includes("ogg")
          ? "ogg"
          : mime.includes("wav")
            ? "wav"
            : "webm";
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `message-vocal.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      logger.error(e instanceof Error ? e.message : String(e));
      toast.error("Téléchargement impossible");
    }
  };

  return (
    <div className="flex w-full items-center gap-3 rounded-[16px] border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition hover:scale-105 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900/20"
        aria-label={isPlaying ? "Mettre en pause" : "Lire l'audio"}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" fill="currentColor" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="absolute left-0 top-0 h-full bg-slate-900 transition-all duration-100"
            style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : "0%" }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold tracking-wider text-slate-400">
          <span>{formatTime(progress)}</span>
          <span>{duration > 0 ? formatTime(duration) : "0:00"}</span>
        </div>
      </div>
      <div className="h-8 w-px bg-slate-100" />
      <button
        type="button"
        data-testid="smart-form-audio-download"
        onClick={downloadBlob}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/20"
        aria-label="Télécharger le message vocal"
      >
        <Download className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/20"
        aria-label="Supprimer le vocal"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step 2 — Description
// ---------------------------------------------------------------------------

type AudioRecorderLike = {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
  transcription: string;
  interimTranscript: string;
  isTranscribing: boolean;
};

type Props = {
  audioBlob: Blob | null;
  setAudioBlob: (v: Blob | null) => void;
  audioTranscription: string;
  setAudioTranscription: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  demoAudioSaving: boolean;
  audioRecorder: AudioRecorderLike;
  onContinue: () => void;
};

export default function SmartFormStep2Description({
  audioBlob,
  setAudioBlob,
  audioTranscription,
  setAudioTranscription,
  description,
  setDescription,
  demoAudioSaving,
  audioRecorder,
  onContinue,
}: Props) {
  const canContinue =
    !audioRecorder.isRecording &&
    (description.trim().length > 0 ||
      audioBlob !== null ||
      audioTranscription.trim().length > 0 ||
      audioRecorder.transcription.length > 0);

  return (
    <div className="flex flex-col gap-4 items-center" role="region" aria-label="Étape 2 — Détails">
      <p className="text-center text-[16px] font-extrabold tracking-tight text-slate-900">
        Expliquez-nous le problème
      </p>

      {!audioBlob ? (
        <div className="flex flex-col items-center justify-center gap-4 py-6">
          <button
            type="button"
            data-testid="smart-form-mic-button"
            disabled={demoAudioSaving}
            onClick={
              audioRecorder.isRecording ? audioRecorder.stopRecording : audioRecorder.startRecording
            }
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30",
              demoAudioSaving && "cursor-wait opacity-60",
              audioRecorder.isRecording
                ? "bg-red-500 text-white animate-pulse shadow-red-500/40"
                : "bg-slate-900 text-white hover:bg-slate-800 hover:scale-105"
            )}
          >
            {audioRecorder.isRecording ? (
              <div className="h-6 w-6 rounded-sm bg-white" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>
          <p className="text-sm font-medium text-slate-500" data-testid="smart-form-mic-hint">
            {demoAudioSaving
              ? "Sauvegarde de l'audio démo…"
              : audioRecorder.isRecording
                ? "Enregistrement en cours..."
                : "Appuyez pour parler"}
          </p>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-3 py-2">
          <AudioPlayer
            blob={audioBlob}
            onRemove={() => {
              audioRecorder.resetRecording();
              setAudioBlob(null);
              setAudioTranscription("");
            }}
          />
        </div>
      )}

      {(audioTranscription ||
        audioRecorder.transcription ||
        audioRecorder.interimTranscript ||
        audioRecorder.isTranscribing) && (
        <div className="w-full rounded-xl bg-slate-50 p-4 border border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Transcription
          </p>
          <p className="text-sm text-slate-700 italic">
            {audioRecorder.isTranscribing
              ? "Transcription en cours..."
              : `"${audioTranscription || audioRecorder.transcription || audioRecorder.interimTranscript}"`}
          </p>
        </div>
      )}

      <div className="w-full">
        <label className="block">
          <span className="sr-only">Description du problème</span>
          <textarea
            data-testid="smart-form-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détaillez votre problème ici..."
            rows={3}
            className="w-full resize-none rounded-[14px] border border-black/[0.06] bg-white/95 py-2.5 px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900/15"
          />
        </label>
      </div>

      <div className="mt-2 flex w-full gap-2">
        <button
          type="button"
          data-testid="smart-form-continue"
          disabled={!canContinue}
          onClick={() => {
            if (audioRecorder.isRecording) return;
            onContinue();
          }}
          className="min-h-[48px] w-full rounded-[14px] bg-slate-900 px-4 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-40"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
