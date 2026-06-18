"use client";

import type { Intervention } from "@/features/interventions/types";
import { buildTechnicianMissionPresentation } from "@/features/interventions/technicianMissionPresentation";
import { isTechnicianAssignmentAwaitingResponse } from "@/features/interventions/technicianAssignmentActions";
import { cn } from "@/lib/utils";
import "./technician-mobile-mission.css";

type Props = {
  missions: Intervention[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  t: (key: string) => string;
  technicianUid?: string | null;
};

/** Sélecteur jour — pastilles horaires uniquement (masqué si une seule mission). */
export default function TechnicianMobileDayStrip({
  missions,
  selectedId,
  onSelect,
  t,
  technicianUid,
}: Props) {
  if (missions.length <= 1) {
    return missions.length === 0 ? (
      <div data-testid="technician-mobile-day-strip-empty" className="h-2 shrink-0" aria-hidden />
    ) : null;
  }

  return (
    <nav
      data-testid="technician-mobile-day-strip"
      className="tm-day-rail shrink-0"
      aria-label="Missions"
    >
      {missions.map((iv) => {
        const { timeLabel } = buildTechnicianMissionPresentation(iv, t);
        const selected = iv.id === selectedId;
        const isOffer = technicianUid && isTechnicianAssignmentAwaitingResponse(iv, technicianUid);
        return (
          <button
            key={iv.id}
            type="button"
            data-testid={`technician-mobile-mission-chip-${iv.id}`}
            data-selected={selected ? "true" : "false"}
            onClick={() => onSelect(iv.id)}
            className={cn(
              "tm-day-pill",
              selected && "tm-day-pill--active",
              isOffer && !selected && "tm-day-pill--offer"
            )}
          >
            {timeLabel}
          </button>
        );
      })}
    </nav>
  );
}
