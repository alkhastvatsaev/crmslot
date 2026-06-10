"use client";

import React from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { SMART_FORM_MAX_PHOTOS } from "@/features/interventions/hooks/useSmartForm";

type Props = {
  photoDataUrls: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onIngestFiles: (files: FileList | File[]) => void;
  onRemovePhoto: (idx: number) => void;
  onContinue: () => void;
};

export default function SmartFormStep3Photos({
  photoDataUrls,
  fileInputRef,
  onIngestFiles,
  onRemovePhoto,
  onContinue,
}: Props) {
  return (
    <div className="flex flex-col gap-3" role="region" aria-label="Étape 3 — Photos">
      <span className="sr-only">Photos</span>
      <div
        data-testid="smart-form-dropzone"
        aria-label={`Ajouter jusqu'à ${SMART_FORM_MAX_PHOTOS} images, glisser-déposer possible`}
        className="mx-auto w-full max-w-md rounded-[18px] border border-black/[0.08] bg-white/60 p-3 shadow-[0_6px_20px_-12px_rgba(15,23,42,0.12)]"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          void onIngestFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          data-testid="smart-form-file-input"
          onChange={(e) => {
            const fl = e.target.files;
            if (fl?.length) void onIngestFiles(fl);
            e.target.value = "";
          }}
        />
        <ul className="grid grid-cols-2 gap-2" role="list" aria-label="Emplacements photo">
          {Array.from({ length: SMART_FORM_MAX_PHOTOS }, (_, i) => {
            const src = photoDataUrls[i];
            const filled = Boolean(src);
            const isNextSlot =
              !filled && i === photoDataUrls.length && photoDataUrls.length < SMART_FORM_MAX_PHOTOS;

            return (
              <li key={i} className="aspect-square min-h-0">
                {filled ? (
                  <div
                    className="relative h-full w-full overflow-hidden rounded-[14px] border border-black/[0.08] bg-slate-100 shadow-sm"
                    data-testid={`smart-form-photo-slot-${i}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      data-testid={`smart-form-photo-remove-${i}`}
                      aria-label={`Retirer la photo ${i + 1}`}
                      className="absolute right-1 top-1 rounded-lg bg-black/55 p-1.5 text-white outline-none transition hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white/80"
                      onClick={() => onRemovePhoto(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                ) : isNextSlot ? (
                  <button
                    type="button"
                    data-testid={`smart-form-photo-slot-${i}`}
                    aria-label={`Ajouter une image (${i + 1} sur ${SMART_FORM_MAX_PHOTOS})`}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-full w-full items-center justify-center rounded-[14px] border-2 border-dashed border-emerald-500/40 bg-emerald-500/[0.05] outline-none transition hover:border-emerald-500/60 hover:bg-emerald-500/[0.08] focus-visible:ring-2 focus-visible:ring-emerald-600/35"
                  >
                    <ImagePlus
                      className="h-9 w-9 shrink-0 text-emerald-700/85"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </button>
                ) : (
                  <div
                    data-testid={`smart-form-photo-slot-${i}`}
                    className="flex h-full w-full items-center justify-center rounded-[14px] border border-dashed border-black/[0.08] bg-white/[0.35]"
                    aria-label={`Emplacement ${i + 1} sur ${SMART_FORM_MAX_PHOTOS}, disponible ensuite`}
                  >
                    <ImagePlus
                      className="h-7 w-7 shrink-0 text-slate-300/90"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        data-testid="smart-form-continue"
        onClick={onContinue}
        className="min-h-[48px] w-full rounded-[14px] bg-slate-900 px-4 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800"
      >
        Continuer
      </button>
    </div>
  );
}
