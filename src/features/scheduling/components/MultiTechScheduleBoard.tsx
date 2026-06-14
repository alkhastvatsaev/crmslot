"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { isInterventionPendingBackOfficeIntake } from "@/features/interventions/technicianSchedule";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import type { Intervention } from "@/features/interventions/types";
import { SCHEDULING_WORK_SLOTS } from "@/features/scheduling/schedulingConstants";
import { getInterventionOccupiedRange } from "@/features/scheduling/interventionOccupiedRange";
import { useTechnicians } from "@/features/technicians/hooks";

type Props = {
  interventions: Intervention[];
  dateYmd: string;
  onSchedule: (interventionId: string, technicianUid: string, time: string) => void;
};

function slotLabel(time: string): string {
  return time.slice(0, 5);
}

export default function MultiTechScheduleBoard({ interventions, dateYmd, onSchedule }: Props) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("multiTechSchedule");
  const { technicians } = useTechnicians();
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<string | null>(null);

  const unassigned = useMemo(
    () =>
      interventions.filter(
        (iv) => isInterventionPendingBackOfficeIntake(iv) && !iv.assignedTechnicianUid?.trim()
      ),
    [interventions]
  );

  const dayInterventions = useMemo(
    () =>
      interventions.filter((iv) => {
        const day = iv.scheduledDate ?? iv.requestedDate;
        return day === dateYmd && iv.assignedTechnicianUid?.trim();
      }),
    [interventions, dateYmd]
  );

  const occupiedByTechSlot = useMemo(() => {
    const map = new Map<string, Intervention>();
    for (const iv of dayInterventions) {
      const uid = iv.assignedTechnicianUid?.trim();
      const time = (iv.scheduledTime ?? "").trim().slice(0, 5);
      if (!uid || !time) continue;
      if (!getInterventionOccupiedRange(iv)) continue;
      map.set(`${uid}::${time}`, iv);
    }
    return map;
  }, [dayInterventions]);

  if (!enabled || technicians.length === 0) return null;

  return (
    <section
      data-testid="multi-tech-schedule-board"
      className="overflow-x-auto rounded-[14px] border border-indigo-100 bg-indigo-50/30 p-3"
    >
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-indigo-800">
        {t("scheduling.multi_tech.title")}
      </p>
      {unassigned.length > 0 ? (
        <ul data-testid="multi-tech-unassigned" className="mb-3 flex flex-wrap gap-2">
          {unassigned.map((iv) => (
            <li key={iv.id}>
              <button
                type="button"
                draggable
                data-testid={`multi-tech-drag-${iv.id}`}
                onDragStart={() => setDragId(iv.id)}
                onDragEnd={() => setDragId(null)}
                className={cn(
                  "cursor-grab rounded-lg border border-indigo-200 bg-white px-2 py-1 text-[10px] font-semibold text-indigo-900",
                  dragId === iv.id && "ring-2 ring-indigo-400"
                )}
              >
                {iv.title?.slice(0, 24) || iv.id.slice(0, 8)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-indigo-50/90 px-2 py-1 text-left font-semibold text-slate-600">
              {t("scheduling.multi_tech.technician")}
            </th>
            {SCHEDULING_WORK_SLOTS.map((slot) => (
              <th key={slot} className="px-1 py-1 font-semibold text-slate-500">
                {slotLabel(slot)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {technicians.map((tech) => {
            const uid = tech.authUid?.trim() ?? "";
            if (!uid) return null;
            return (
              <tr key={tech.id} data-testid={`multi-tech-row-${uid}`}>
                <td className="sticky left-0 bg-white px-2 py-1 font-semibold text-slate-800">
                  {tech.name}
                </td>
                {SCHEDULING_WORK_SLOTS.map((slot) => {
                  const key = `${uid}::${slotLabel(slot)}`;
                  const occupied = occupiedByTechSlot.get(key);
                  return (
                    <td key={slot} className="p-0.5">
                      <button
                        type="button"
                        data-testid={`multi-tech-cell-${uid}-${slotLabel(slot)}`}
                        disabled={Boolean(occupied)}
                        onDragOver={(e) => {
                          if (!dragId || occupied) return;
                          e.preventDefault();
                          setHoverCell(key);
                        }}
                        onDragLeave={() => setHoverCell(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!dragId || occupied) return;
                          onSchedule(dragId, uid, slot);
                          setDragId(null);
                          setHoverCell(null);
                        }}
                        onClick={() => {
                          const pick =
                            dragId ||
                            unassigned[0]?.id ||
                            interventions.find(
                              (iv) => !iv.assignedTechnicianUid?.trim() && iv.status === "pending"
                            )?.id;
                          if (pick) onSchedule(pick, uid, slot);
                        }}
                        className={cn(
                          "h-8 w-full min-w-[3rem] rounded border text-[10px]",
                          occupied
                            ? "border-slate-300 bg-slate-200 text-slate-600 cursor-default"
                            : hoverCell === key
                              ? "border-indigo-500 bg-indigo-200"
                              : "border-dashed border-indigo-200 bg-white hover:bg-indigo-100"
                        )}
                        title={occupied ? occupied.title : undefined}
                      >
                        {occupied ? "●" : "+"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
