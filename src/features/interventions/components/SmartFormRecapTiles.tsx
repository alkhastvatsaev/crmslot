"use client";

import React from "react";
import { Calendar, FileText, MapPin, Mic, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RECAP_SQUARE_ICON_CHIP,
  RECAP_SQUARE_TILE_CLASS,
} from "@/features/interventions/smartFormRecapStyles";

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
};

export default function SmartFormRecapTiles({
  firstName,
  lastName,
  phone,
  address,
  description,
  audioTranscription,
  audioBlob,
  scheduledDate,
  scheduledTime,
}: Props) {
  return (
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
            <p className="text-xs font-normal italic leading-snug text-slate-400">Non renseigné</p>
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
            <p className="text-xs font-normal italic leading-snug text-slate-400">Non renseigné</p>
          )}
        </div>
      </div>

      {/* Description tile */}
      <div
        role="group"
        aria-label={
          description.trim() ? `Description : ${description.trim()}` : "Description non renseignée"
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
          audioTranscription ? `Message vocal : ${audioTranscription}` : "Pas de message vocal"
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
      {scheduledDate && scheduledTime ? (
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
      ) : null}
    </div>
  );
}
