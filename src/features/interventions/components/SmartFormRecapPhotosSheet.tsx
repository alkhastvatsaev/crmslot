"use client";

import React from "react";
import Image from "next/image";
import { ImagePlus, Images, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SMART_FORM_MAX_PHOTOS } from "@/features/interventions/hooks/useSmartForm";

type StripProps = {
  photoDataUrls: string[];
  onOpen: () => void;
};

export function SmartFormRecapPhotosStrip({ photoDataUrls, onOpen }: StripProps) {
  return (
    <button
      type="button"
      data-testid="smart-form-recap-photos-open"
      aria-label={
        photoDataUrls.length > 0
          ? `Agrandir ou parcourir les ${photoDataUrls.length} photo${photoDataUrls.length !== 1 ? "s" : ""}`
          : "Voir les emplacements photos (aucune image)"
      }
      onClick={onOpen}
      className="group w-full shrink-0 rounded-[12px] border border-slate-200/85 bg-gradient-to-br from-white/95 via-slate-50/65 to-white/88 p-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.04] transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
    >
      <div className="mb-2.5 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
          <Images className="h-3.5 w-3.5 text-slate-400" aria-hidden />
          Photos
        </span>
        <span className="tabular-nums text-[10px] font-semibold text-slate-500">
          {photoDataUrls.length}/{SMART_FORM_MAX_PHOTOS}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: SMART_FORM_MAX_PHOTOS }, (_, i) => {
          const src = photoDataUrls[i];
          const filled = Boolean(src);
          return (
            <div
              key={`recap-photo-preview-${i}`}
              data-testid={`smart-form-recap-photo-preview-${i}`}
              aria-hidden={!filled}
              className={cn(
                "relative h-10 w-full min-w-0 shrink-0 overflow-hidden rounded-[8px]",
                filled
                  ? "border border-white/90 bg-white shadow-sm ring-1 ring-black/[0.06]"
                  : "flex items-center justify-center border border-dashed border-slate-300/70 bg-white/60"
              )}
            >
              {filled ? (
                <Image
                  src={src}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImagePlus className="h-4 w-4 text-slate-400/85" strokeWidth={1.75} aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </button>
  );
}

type SheetProps = {
  photoDataUrls: string[];
  open: boolean;
  onClose: () => void;
};

export function SmartFormRecapPhotosSheet({ photoDataUrls, open, onClose }: SheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[280] flex items-end justify-center bg-slate-950/50 p-3 pb-4 backdrop-blur-[6px] sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Photos jointes à la demande"
        data-testid="smart-form-recap-photos-sheet"
        className="max-h-[min(85dvh,34rem)] w-full max-w-md overflow-hidden rounded-[24px] border border-white/35 bg-white/[0.97] shadow-[0_32px_72px_-20px_rgba(15,23,42,0.38),0_0_0_1px_rgba(255,255,255,0.6)_inset] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200/70 bg-gradient-to-r from-white/80 to-slate-50/40 px-4 py-3.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Aperçu
            </p>
            <p className="mt-0.5 text-[16px] font-bold tracking-tight text-slate-900">Photos</p>
          </div>
          <button
            type="button"
            data-testid="smart-form-recap-photos-close"
            aria-label="Fermer"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/[0.06] text-slate-700 transition hover:bg-slate-900/10 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="max-h-[min(70dvh,28rem)] overflow-y-auto bg-gradient-to-b from-slate-50/30 to-white p-4">
          {photoDataUrls.length > 0 ? (
            <ul className="mx-auto grid max-w-sm grid-cols-2 gap-3" aria-label="Photos">
              {photoDataUrls.slice(0, SMART_FORM_MAX_PHOTOS).map((src, i) => (
                <li
                  key={`recap-modal-${i}-${src.slice(0, 24)}`}
                  className="aspect-square overflow-hidden rounded-[18px] border border-white/90 bg-slate-200 shadow-[0_12px_28px_-10px_rgba(15,23,42,0.22),0_0_0_1px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.04]"
                >
                  <Image
                    src={src}
                    alt=""
                    width={400}
                    height={400}
                    className="h-full w-full object-cover"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200/80">
                <ImagePlus className="h-7 w-7 text-slate-400" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="max-w-[14rem] text-[14px] font-medium leading-snug text-slate-500">
                Aucune photo jointe à cette demande
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
