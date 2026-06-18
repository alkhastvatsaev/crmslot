"use client";

import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  timeLabel: string;
  clientDisplayName: string;
  address: string | null;
  /** Lien Google Maps (itinéraire) — clic sur l’adresse affichée. */
  addressMapsHref?: string | null;
  descriptionText: string | null;
  /** Avant acceptation : texte problème plus marqué. */
  awaitingAssignment?: boolean;
  /** Contact (appel / mail / GPS) intégré sous la description, dans le même cadre. */
  contactRail?: ReactNode;
};

/**
 * Fiche mission centrée — carte hero (heure / client / adresse) + détail en dessous.
 */
export default function TechnicianMissionBrief({
  timeLabel,
  clientDisplayName,
  address,
  addressMapsHref = null,
  descriptionText,
  awaitingAssignment = false,
  contactRail,
}: Props) {
  return (
    <article
      data-testid="technician-mission-brief"
      className={cn(
        "technician-mission-brief flex min-h-0 w-full flex-1 flex-col",
        awaitingAssignment && "technician-mission-brief--offer"
      )}
    >
      <header
        data-testid="technician-mission-brief-hero"
        className="technician-mission-brief__hero shrink-0 rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-800 to-zinc-600 px-5 py-5 text-center text-white shadow-[0_22px_44px_-18px_rgba(9,9,11,0.55)] ring-1 ring-inset ring-white/10"
      >
        <p
          data-testid="technician-detail-time"
          className="text-[3rem] font-extrabold tabular-nums leading-none tracking-tight text-white"
        >
          {timeLabel}
        </p>

        <p
          role="heading"
          aria-level={1}
          data-testid="technician-detail-client-name"
          className="technician-detail-client-name technician-mission-brief__name mt-3 line-clamp-3 text-[1.875rem] font-bold leading-tight tracking-tight"
        >
          {clientDisplayName}
        </p>

        {address ? (
          addressMapsHref ? (
            <a
              href={addressMapsHref}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="technician-detail-address-link"
              className="technician-mission-brief__address technician-detail-address !m-0 mx-auto mt-4 flex max-w-full items-start justify-center gap-2.5 px-1 text-[1.0625rem] font-semibold leading-snug text-white/90 transition active:text-white"
            >
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 opacity-80" aria-hidden />
              <span className="line-clamp-3 text-left">{address}</span>
            </a>
          ) : (
            <p className="technician-mission-brief__address technician-detail-address !m-0 mx-auto mt-4 flex max-w-full items-start justify-center gap-2.5 px-1 text-[1.0625rem] font-semibold leading-snug text-white/90">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 opacity-80" aria-hidden />
              <span className="line-clamp-3 text-left">{address}</span>
            </p>
          )
        ) : null}

        {contactRail ? (
          <div data-testid="technician-mission-brief-contacts" className="mt-5 w-full">
            {contactRail}
          </div>
        ) : null}
      </header>

      {descriptionText ? (
        <div
          data-testid="technician-detail-description"
          className="technician-mission-brief__body mt-4 flex min-h-0 flex-1 flex-col"
        >
          <p
            data-testid="technician-detail-description-text"
            className={cn(
              "technician-detail-description-text !m-0 min-h-0 flex-1 overflow-y-auto text-center text-balance leading-relaxed",
              awaitingAssignment
                ? "!text-[17px] !font-semibold !text-slate-800"
                : "!text-[17px] !font-semibold text-slate-700"
            )}
          >
            {descriptionText}
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1" aria-hidden />
      )}
    </article>
  );
}
