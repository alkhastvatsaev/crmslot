"use client";

import { X } from "lucide-react";

type Props = {
  transcriptTextEnabled: boolean;
  fullText: string;
  shown: string;
  onClose: () => void;
};

export default function MapTranscriptionOverlayView({
  transcriptTextEnabled,
  fullText,
  shown,
  onClose,
}: Props) {
  return (
    <>
      <div
        data-testid="map-transcription-dim"
        className="pointer-events-none absolute inset-0 z-[9990] bg-gradient-to-b from-black/0 via-black/35 to-black/75 transition-opacity duration-200"
      />

      <div className="pointer-events-none absolute top-3 right-3 z-[9999]">
        <button
          type="button"
          data-testid="map-transcription-close"
          onClick={onClose}
          className="pointer-events-auto relative p-2 text-white transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          aria-label="Fermer la transcription"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2 z-0 rounded-full bg-black/40 blur-md opacity-80"
          />
          <X className="relative z-10 h-5 w-5 text-white opacity-100" strokeWidth={2.6} />
        </button>
      </div>

      <div
        data-testid="map-transcription-overlay"
        className="dashboard-desktop-galaxy-rail z-[9999]"
      >
        {transcriptTextEnabled && fullText.trim() ? (
          <div
            data-testid="map-transcription-text"
            className="max-w-[min(92vw,820px)] whitespace-pre-wrap text-center text-2xl font-extrabold leading-snug tracking-tight text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.75)]"
            style={{ contain: "layout style" }}
          >
            {shown}
          </div>
        ) : transcriptTextEnabled ? (
          <div
            data-testid="map-transcription-loading"
            className="max-w-[min(92vw,820px)] text-center text-lg font-semibold text-white/90 drop-shadow-[0_3px_18px_rgba(0,0,0,0.75)]"
          >
            Transcription…
          </div>
        ) : null}
      </div>
    </>
  );
}
