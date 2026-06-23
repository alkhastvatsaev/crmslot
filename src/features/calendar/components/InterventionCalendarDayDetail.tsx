"use client";

import { CalendarDays } from "lucide-react";
import type { Intervention } from "@/features/interventions";
import CalendarInterventionSlotRow from "@/features/calendar/components/CalendarInterventionSlotRow";

export default function InterventionCalendarDayDetail({
  selectedDayKey,
  selectedDayLabel,
  selectedItems,
  t,
}: {
  selectedDayKey: string | null;
  selectedDayLabel: string | null;
  selectedItems: Intervention[];
  t: (key: string) => string;
}) {
  return (
    <section
      data-testid="calendar-day-detail"
      className="overflow-hidden rounded-[16px] border border-black/[0.05] bg-gradient-to-b from-white to-slate-50/40 p-4 shadow-[0_8px_32px_-18px_rgba(15,23,42,0.15)]"
      aria-labelledby="calendar-day-detail-heading"
    >
      <div className="mb-4 flex flex-col gap-0.5 border-b border-black/[0.06] pb-3">
        <h3
          id="calendar-day-detail-heading"
          className="text-[13px] font-bold uppercase tracking-[0.12em] text-slate-400"
        >
          Journée
        </h3>
        {selectedDayLabel ? (
          <p className="text-[17px] font-bold capitalize leading-snug tracking-tight text-slate-900">
            {selectedDayLabel}
          </p>
        ) : (
          <p className="text-[15px] font-semibold text-slate-500">Choisir un jour</p>
        )}
        {selectedDayKey ? (
          <p
            className="text-[12px] font-semibold text-slate-500"
            data-testid="calendar-day-detail-count"
          >
            {selectedItems.length === 0
              ? "Aucune intervention"
              : `${selectedItems.length} intervention${selectedItems.length > 1 ? "s" : ""}`}
          </p>
        ) : null}
      </div>

      <p className="sr-only">Détail du jour{selectedDayKey ? ` ${selectedDayKey}` : ""}</p>
      {selectedDayKey && selectedItems.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {selectedItems.map((iv) => (
            <CalendarInterventionSlotRow key={iv.id} iv={iv} t={t} />
          ))}
        </ul>
      ) : selectedDayKey ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CalendarDays className="h-10 w-10 text-slate-200/90" aria-hidden />
          <p className="mt-3 text-[13px] font-medium text-slate-500">Libre ce jour-ci.</p>
          <p className="sr-only">Jour sans intervention planifiée.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CalendarDays className="h-10 w-10 text-slate-200/90" aria-hidden />
          <p className="mt-3 text-[13px] font-medium text-slate-500">
            Touchez un jour dans la grille ci-dessus.
          </p>
          <p className="sr-only">Sélectionner un jour dans le calendrier.</p>
        </div>
      )}
    </section>
  );
}
