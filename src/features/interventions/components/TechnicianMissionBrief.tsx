"use client";

import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  timeLabel: string;
  clientDisplayName: string;
  address: string | null;
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
  descriptionText,
  awaitingAssignment = false,
  contactRail,
}: Props) {
  return (
    <article
      data-testid="technician-mission-brief"
      className={cn(
        "technician-mission-brief flex min-h-0 w-full flex-col items-center text-center",
        awaitingAssignment && "technician-mission-brief--offer",
      )}
    >
      <span
        className="technician-mission-brief__time inline-flex items-center justify-center rounded-full bg-slate-900 px-3.5 py-1 text-[11px] font-semibold tabular-nums tracking-wide text-white shadow-sm"
        data-testid="technician-detail-time"
      >
        {timeLabel}
      </span>

      <p
        role="heading"
        aria-level={1}
        data-testid="technician-detail-client-name"
        className="technician-detail-client-name technician-mission-brief__name mt-3 line-clamp-2 text-[1.375rem] font-semibold leading-[1.15] tracking-tight text-slate-900"
      >
        {clientDisplayName}
      </p>

      {address ? (
        <p className="technician-mission-brief__address technician-detail-address !m-0 mt-2 flex items-start justify-center gap-1.5 text-[12px] font-medium leading-snug text-slate-500">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <span className="line-clamp-2">{address}</span>
        </p>
      ) : null}

      {descriptionText ? (
        <div
          data-testid="technician-detail-description"
          className={cn(
            "technician-mission-brief__body mt-4 min-h-0 w-full",
            awaitingAssignment
              ? "rounded-2xl bg-slate-50/90 px-3 py-2.5 ring-1 ring-slate-900/[0.04]"
              : "border-t border-slate-200/70 pt-3",
          )}
        >
          <p
            data-testid="technician-detail-description-text"
            className={cn(
              "technician-detail-description-text !m-0 line-clamp-4 overflow-hidden text-ellipsis leading-snug text-slate-700",
              awaitingAssignment
                ? "!text-[14px] !font-semibold !text-slate-800"
                : "!text-[13px] !font-normal text-slate-600",
            )}
          >
            {descriptionText}
          </p>
        </div>
      ) : null}

      {contactRail ? (
        <div
          data-testid="technician-mission-brief-contacts"
          className="mt-3 w-full shrink-0 border-t border-slate-200/80 pt-3"
        >
          {contactRail}
        </div>
      ) : null}
    </article>
  );
}
