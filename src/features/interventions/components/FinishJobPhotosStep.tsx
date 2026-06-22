"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRESENTATION_PRIVACY_MODE } from "@/core/config/presentationMode";
import { FINISH_JOB_MAX_PHOTOS } from "@/features/interventions/finishJobConstants";
import { TERRAIN_BTN_CAPTURE, TERRAIN_BTN_SM } from "@/features/interventions/terrainMobileChrome";
import type { FinishWizardPhoto } from "@/features/interventions/technicianCompletionReport";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  photos: FinishWizardPhoto[];
  onCapture: () => void;
  onRemovePhoto: (idx: number) => void;
};

export default function FinishJobPhotosStep({ videoRef, photos, onCapture, onRemovePhoto }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-slate-950 shadow-lg ring-1 ring-black/10">
        <video
          ref={videoRef}
          className={cn(
            "h-full w-full object-cover",
            PRESENTATION_PRIVACY_MODE ? "blur-2xl" : null
          )}
          muted
          playsInline
          autoPlay
          aria-label={String(t("technician_hub.finish.camera_done"))}
        />
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />

        <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center">
          <button
            type="button"
            data-testid="finish-job-capture-btn"
            disabled={photos.length >= FINISH_JOB_MAX_PHOTOS}
            onClick={onCapture}
            aria-label={String(t("technician_hub.finish.capture_photo"))}
            className={cn(
              "flex h-14 w-14 items-center justify-center border-[3px] border-white/90 bg-white/95 shadow-lg transition active:scale-95 disabled:opacity-40",
              TERRAIN_BTN_CAPTURE
            )}
          >
            <div className="h-9 w-9 rounded-full bg-slate-900" />
          </button>
        </div>

        {PRESENTATION_PRIVACY_MODE ? (
          <div className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
            {String(t("technician_hub.finish.presentation_mode"))}
          </div>
        ) : null}
      </div>

      <div
        data-testid="finish-job-photo-strip"
        className="mt-2 flex h-14 shrink-0 items-center gap-2 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {photos.map((photo, i) => (
          <div
            key={`${i}-${photo.url.slice(0, 24)}`}
            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt=""
              className={cn(
                "h-full w-full object-cover",
                PRESENTATION_PRIVACY_MODE ? "blur-lg" : null
              )}
            />
            <button
              type="button"
              data-testid={`finish-job-photo-remove-${i}`}
              aria-label={String(t("technician_hub.finish.delete_photo"))}
              onClick={() => onRemovePhoto(i)}
              className={cn(
                "absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center bg-black/55 text-white",
                TERRAIN_BTN_SM
              )}
            >
              <Trash2 className="h-2.5 w-2.5" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
