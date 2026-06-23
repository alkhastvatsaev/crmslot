"use client";

import type { RefObject } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";
import { SMART_FORM_MAX_PHOTOS } from "@/features/interventions/hooks/useSmartForm";

type Props = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  photoDataUrls: string[];
  validationFailedCount: number;
  onIngestFiles: (files: FileList) => void;
  onRemovePhoto: (index: number) => void;
};

export default function RequesterStepPhotos({
  fileInputRef,
  photoDataUrls,
  validationFailedCount,
  onIngestFiles,
  onRemovePhoto,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 mt-1">
      <h2 className="text-center text-xl font-bold text-slate-800">
        {String(t("requester.intervention.photos_heading"))}
      </h2>
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files?.length) {
            onIngestFiles(e.target.files);
          }
          e.target.value = "";
        }}
      />
      <div className="grid grid-cols-2 gap-6">
        {Array.from({ length: SMART_FORM_MAX_PHOTOS }, (_, i) => {
          const src = photoDataUrls[i];
          const filled = Boolean(src);
          const isNextSlot = !filled && i === photoDataUrls.length;

          return (
            <div key={i} className="aspect-square relative group">
              {filled ? (
                <div className="relative h-full w-full overflow-hidden rounded-[24px] shadow-sm border border-black/5">
                  <Image
                    src={src}
                    alt=""
                    width={400}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <button
                    type="button"
                    onClick={() => onRemovePhoto(i)}
                    aria-label={String(t("smart_form.step3.removePhotoAria")).replace(
                      "{n}",
                      String(i + 1)
                    )}
                    className="absolute right-2 top-2 rounded-full bg-white/90 backdrop-blur-md p-2.5 text-black shadow-sm opacity-0 group-hover:opacity-100 hover:bg-white transition-all duration-300 transform scale-90 group-hover:scale-100"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
                </div>
              ) : isNextSlot ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex h-full w-full flex-col gap-2 items-center justify-center rounded-[24px] transition-all duration-300 active:scale-[0.98]",
                    i === 0 && validationFailedCount > 0
                      ? "bg-red-50/50 border-2 border-dashed border-red-300 hover:bg-red-50 hover:border-red-400 text-red-600 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  )}
                >
                  <div className="rounded-full bg-white shadow-sm p-3 transition-transform duration-300 group-hover:scale-105">
                    <ImagePlus
                      className={cn(
                        "h-6 w-6",
                        i === 0 && validationFailedCount > 0 ? "text-red-500" : "text-slate-800"
                      )}
                    />
                  </div>
                  <span className="text-base font-bold tracking-tight">
                    {i === 0 && validationFailedCount > 0
                      ? String(t("requester.intervention.photo_required"))
                      : String(t("requester.intervention.photo_add"))}
                  </span>
                </button>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-[24px] bg-slate-50 border border-black/5">
                  <ImagePlus className="h-6 w-6 text-slate-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
