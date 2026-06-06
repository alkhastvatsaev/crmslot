"use client";

import { logger } from "@/core/logger";

import React, { useEffect, useRef, useState } from "react";
import { Download, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";

// ── AudioPlayer ──────────────────────────────────────────────────────────────

interface AudioPlayerProps {
  blob: Blob;
  onRemove: () => void;
}

export const AudioPlayer = ({ blob, onRemove }: AudioPlayerProps) => {
  const { t } = useTranslation();
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
      // Fallback pour Safari iOS quand le blob est vide ou corrompu
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
      audioRef.current.play();
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
        aria-label={String(
          isPlaying
            ? t("requester.intervention.audio_pause_aria")
            : t("requester.intervention.audio_play_aria")
        )}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" fill="currentColor" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-100"
            style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : "0%" }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500 focus-visible:bg-red-50 focus-visible:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20"
        aria-label={String(t("requester.intervention.audio_remove_aria"))}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

// ── AudioDownloadButton ───────────────────────────────────────────────────────

interface AudioDownloadButtonProps {
  blob: Blob;
}

export const AudioDownloadButton = ({ blob }: AudioDownloadButtonProps) => {
  const { t } = useTranslation();

  const handleDownload = () => {
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
      toast.error(String(t("requester.intervention.download_failed_toast")));
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
      aria-label={String(t("requester.intervention.voice_download_aria"))}
    >
      <Download className="h-3 w-3" />
    </button>
  );
};
