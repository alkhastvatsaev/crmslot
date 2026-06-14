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
 * Fiche mission centrée — typo et ombres type « briefing » terrain.
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
        "technician-mission-brief flex min-h-0 w-full flex-1 flex-col text-center",
        awaitingAssignment && "technician-mission-brief--offer"
      )}
    >
      <header className="flex shrink-0 flex-col items-center">
        <span
          className="technician-mission-brief__time inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-1.5 text-[12px] font-semibold tabular-nums tracking-wide text-white"
          data-testid="technician-detail-time"
        >
          {timeLabel}
        </span>

        <p
          role="heading"
          aria-level={1}
          data-testid="technician-detail-client-name"
          className="technician-detail-client-name technician-mission-brief__name mt-4 line-clamp-3 text-[1.5rem] font-semibold leading-[1.12] tracking-tight text-slate-900 sm:text-[1.625rem]"
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
              className="technician-mission-brief__address technician-detail-address !m-0 mt-3 flex max-w-full items-start justify-center gap-2 px-1 text-[13px] font-medium leading-snug text-slate-500 underline-offset-2 transition hover:text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span className="line-clamp-3">{address}</span>
            </a>
          ) : (
            <p className="technician-mission-brief__address technician-detail-address !m-0 mt-3 flex max-w-full items-start justify-center gap-2 px-1 text-[13px] font-medium leading-snug text-slate-500">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span className="line-clamp-3">{address}</span>
            </p>
          )
        ) : null}
      </header>

      {descriptionText ? (
        <div
          data-testid="technician-detail-description"
          className="technician-mission-brief__body mt-5 flex min-h-0 flex-1 flex-col border-t border-slate-200/80 pt-5"
        >
          <p
            data-testid="technician-detail-description-text"
            className={cn(
              "technician-detail-description-text !m-0 min-h-0 flex-1 overflow-y-auto text-balance leading-relaxed text-slate-700",
              awaitingAssignment
                ? "!text-[15px] !font-semibold !text-slate-800"
                : "!text-[14px] !font-normal text-slate-600"
            )}
          >
            {descriptionText}
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1" aria-hidden />
      )}

      {contactRail ? (
        <div
          data-testid="technician-mission-brief-contacts"
          className="mt-4 w-full shrink-0 border-t border-slate-200/80 pt-4"
        >
          {contactRail}
        </div>
      ) : null}
    </article>
  );
}
