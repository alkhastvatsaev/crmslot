"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { TERRAIN_BTN_ICON } from "@/features/interventions/terrainMobileChrome";

export default function TechnicianDashboardAudioPlayer({
  url,
  t,
}: {
  url: string;
  t: (key: string) => string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      void audioRef.current.play().then(
        () => setIsPlaying(true),
        () => setIsPlaying(false)
      );
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time) || time === Infinity) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 px-2 py-1.5">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={() => {
          if (!audioRef.current) return;
          setProgress(audioRef.current.currentTime);
          if (audioRef.current.duration && audioRef.current.duration !== Infinity) {
            setDuration(audioRef.current.duration);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current?.duration && audioRef.current.duration !== Infinity) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center bg-blue-600 text-white transition hover:bg-blue-700",
          TERRAIN_BTN_ICON
        )}
        aria-label={
          isPlaying ? t("backoffice.audio_player.pause") : t("backoffice.audio_player.play")
        }
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5" fill="currentColor" />
        ) : (
          <Play className="h-3.5 w-3.5 ml-0.5" fill="currentColor" />
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-100"
            style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : "0%" }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-bold tabular-nums text-slate-500">
          <span>{formatTime(progress)}</span>
          <span>{duration > 0 ? formatTime(duration) : "0:00"}</span>
        </div>
      </div>
    </div>
  );
}
