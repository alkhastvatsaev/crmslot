"use client";

import React from "react";
import Image from "next/image";
import {
  Calendar,
  FileText,
  ImagePlus,
  Images,
  Loader2,
  MapPin,
  Mic,
  SendHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SMART_FORM_MAX_PHOTOS } from "@/features/interventions/hooks/useSmartForm";

const RECAP_SQUARE_TILE_CLASS =
  "relative flex min-h-0 min-w-0 flex-col gap-1.5 overflow-hidden rounded-[12px] border border-white/85 bg-gradient-to-br from-white/[0.99] via-white/92 to-slate-50/88 p-2.5 shadow-sm backdrop-blur-md ring-1 ring-slate-900/[0.05]";

const RECAP_SQUARE_ICON_CHIP =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-gradient-to-b from-white to-slate-100/90 text-slate-600 shadow-[0_3px_8px_-5px_rgba(15,23,42,0.38),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-black/[0.06]";

type Props = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  description: string;
  audioTranscription: string;
  audioBlob: Blob | null;
  scheduledDate: string;
  scheduledTime: string;
  photoDataUrls: string[];
  urgency: boolean;
  setUrgency: (fn: (prev: boolean) => boolean) => void;
  recapPhotosOpen: boolean;
  setRecapPhotosOpen: (v: boolean) => void;
  canSubmit: boolean;
  busy: boolean;
  onSubmit: () => void;
};

export default function SmartFormStep5Recap({
  firstName,
  lastName,
  phone,
  address,
  description,
  audioTranscription,
  audioBlob,
  scheduledDate,
  scheduledTime,
  photoDataUrls,
  urgency,
  setUrgency,
  recapPhotosOpen,
  setRecapPhotosOpen,
  canSubmit,
  busy,
  onSubmit,
}: Props) {
  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      role="region"
      aria-label="Étape 5 — Récapitulatif"
    >
      {/* Scrollable recap area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pb-2 pr-1">
        <div
          data-testid="smart-form-recap-panel"
          className="flex min-w-0 shrink-0 flex-col gap-2 rounded-[16px] bg-gradient-to-b from-slate-100/55 via-white/45 to-white/35 p-2 ring-1 ring-slate-900/[0.04]"
        >
          <div className="grid grid-cols-2 gap-2" aria-label="Récapitulatif par tuiles">
            {/* Contact tile */}
            <div
              data-testid="smart-form-recap-contact"
              role="group"
              aria-label={`Contact : ${
                [firstName, lastName]
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .join(" ") || "non renseigné"
              }${phone.trim() ? `, ${phone.trim()}` : ""}`}
              className={RECAP_SQUARE_TILE_CLASS}
            >
              <div className="flex shrink-0 items-center gap-2">
                <span className={RECAP_SQUARE_ICON_CHIP} aria-hidden>
                  <UserRound className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                <span className="text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-slate-400">
                  Contact
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                {[firstName, lastName].some((s) => s.trim()) || phone.trim() ? (
                  <div className="flex flex-col gap-0.5">
                    {[firstName, lastName].some((s) => s.trim()) ? (
                      <p
                        className="line-clamp-1 break-words text-xs font-semibold leading-tight text-slate-800"
                        title={[firstName, lastName]
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {[firstName, lastName]
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .join(" ")}
                      </p>
                    ) : null}
                    {phone.trim() ? (
                      <p className="line-clamp-1 text-[11px] font-medium tabular-nums leading-tight text-slate-700">
                        {phone.trim()}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs font-normal italic leading-snug text-slate-400">
                    Non renseigné
                  </p>
                )}
              </div>
            </div>

            {/* Address tile */}
            <div
              role="group"
              aria-label={`Adresse : ${address.trim() || "non renseignée"}`}
              className={RECAP_SQUARE_TILE_CLASS}
            >
              <div className="flex shrink-0 items-center gap-2">
                <span className={RECAP_SQUARE_ICON_CHIP} aria-hidden>
                  <MapPin className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                <span className="text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-slate-400">
                  Lieu
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                {address.trim() ? (
                  <p
                    className="line-clamp-2 break-words text-[13px] font-bold leading-tight text-slate-800"
                    title={address.trim()}
                  >
                    {address.trim()}
                  </p>
                ) : (
                  <p className="text-xs font-normal italic leading-snug text-slate-400">
                    Non renseigné
                  </p>
                )}
              </div>
            </div>

            {/* Description tile */}
            <div
              role="group"
              aria-label={
                description.trim()
                  ? `Description : ${description.trim()}`
                  : "Description non renseignée"
              }
              className={RECAP_SQUARE_TILE_CLASS}
            >
              <div className="flex shrink-0 items-center gap-2">
                <span className={RECAP_SQUARE_ICON_CHIP} aria-hidden>
                  <FileText className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                <span className="text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-slate-400">
                  Détail
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                {description.trim() ? (
                  <p
                    className="line-clamp-2 whitespace-pre-wrap break-words text-[11px] font-medium leading-tight text-slate-700"
                    title={description.trim()}
                  >
                    {description.trim()}
                  </p>
                ) : (
                  <p className="text-xs italic leading-snug text-slate-400">Aucun détail</p>
                )}
              </div>
            </div>

            {/* Audio tile */}
            <div
              role="group"
              aria-label={
                audioTranscription
                  ? `Message vocal : ${audioTranscription}`
                  : "Pas de message vocal"
              }
              className={RECAP_SQUARE_TILE_CLASS}
            >
              <div className="flex shrink-0 items-center gap-2">
                <span className={RECAP_SQUARE_ICON_CHIP} aria-hidden>
                  <Mic className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                <span className="text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-slate-400">
                  Vocal
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                {audioTranscription ? (
                  <p
                    className="line-clamp-2 whitespace-pre-wrap break-words text-[11px] font-medium italic leading-tight text-slate-700"
                    title={audioTranscription}
                  >
                    &quot;{audioTranscription}&quot;
                  </p>
                ) : audioBlob ? (
                  <p className="text-xs font-medium text-slate-700">Audio enregistré</p>
                ) : (
                  <p className="text-xs italic leading-snug text-slate-400">Aucun vocal</p>
                )}
              </div>
            </div>

            {/* Schedule tile (full width) */}
            {scheduledDate && scheduledTime && (
              <div
                role="group"
                aria-label={`Créneau prévu : ${scheduledDate} à ${scheduledTime}`}
                className={cn(RECAP_SQUARE_TILE_CLASS, "col-span-2")}
              >
                <div className="flex shrink-0 items-center gap-2">
                  <span className={RECAP_SQUARE_ICON_CHIP} aria-hidden>
                    <Calendar className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </span>
                  <span className="text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-slate-400">
                    Date & Heure
                  </span>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
                  <p className="text-xs font-semibold text-slate-800">
                    {new Intl.DateTimeFormat("fr-BE", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }).format(new Date(scheduledDate))}{" "}
                    <span className="font-medium text-slate-500">à {scheduledTime}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Photo strip button */}
          <button
            type="button"
            data-testid="smart-form-recap-photos-open"
            aria-label={
              photoDataUrls.length > 0
                ? `Agrandir ou parcourir les ${photoDataUrls.length} photo${photoDataUrls.length !== 1 ? "s" : ""}`
                : "Voir les emplacements photos (aucune image)"
            }
            onClick={() => setRecapPhotosOpen(true)}
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
                      <ImagePlus
                        className="h-4 w-4 text-slate-400/85"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </button>
        </div>
      </div>

      {/* Photos modal */}
      {recapPhotosOpen ? (
        <div
          className="fixed inset-0 z-[280] flex items-end justify-center bg-slate-950/50 p-3 pb-4 backdrop-blur-[6px] sm:items-center sm:p-6"
          role="presentation"
          onClick={() => setRecapPhotosOpen(false)}
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
                onClick={() => setRecapPhotosOpen(false)}
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
      ) : null}

      {/* Action bar */}
      <div className="relative z-10 mt-2 flex shrink-0 flex-row gap-1.5 pt-1">
        <button
          type="button"
          data-testid="smart-form-urgency"
          aria-pressed={urgency}
          aria-label={urgency ? "Demande marquée urgente" : "Marquer comme urgent"}
          title={urgency ? "Urgent" : "Marquer comme urgent"}
          onClick={() => setUrgency((u) => !u)}
          className={cn(
            "inline-flex min-h-[34px] min-w-0 flex-1 items-center justify-center rounded-[10px] shadow-[0_10px_28px_-22px_rgba(15,23,42,0.4)] backdrop-blur-sm transition ring-1 active:scale-[0.97]",
            urgency
              ? "border-transparent bg-red-50 text-red-700 ring-red-300/35"
              : "border-transparent bg-gradient-to-b from-white/98 to-slate-50/92 text-slate-600 ring-black/[0.06] hover:from-white hover:to-white"
          )}
        >
          <span className="text-[13px] font-semibold uppercase tracking-wide">Urgent</span>
        </button>

        <button
          type="button"
          data-testid="smart-form-submit"
          aria-label={busy ? "Envoi en cours" : "Envoyer la demande"}
          title="Envoyer la demande"
          disabled={!canSubmit || busy}
          onClick={onSubmit}
          className="inline-flex min-h-[34px] min-w-0 flex-1 items-center justify-center rounded-[10px] bg-slate-900 text-white shadow-[0_16px_36px_-16px_rgba(15,23,42,0.5)] ring-1 ring-white/10 transition hover:bg-slate-800 enabled:active:scale-[0.97] disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
          ) : (
            <SendHorizontal className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
