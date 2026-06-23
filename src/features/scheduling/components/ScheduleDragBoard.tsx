"use client";

import { useMemo, useState } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import type { Intervention } from "@/features/interventions";
import { proposeAvailableSlotsForTechnician } from "@/features/scheduling/proposeAvailableSlots";
import { SCHEDULING_WORK_SLOTS } from "@/features/scheduling/schedulingConstants";
import { isInterventionPendingBackOfficeIntake } from "@/features/interventions/technicianSchedule";
import { useTechnicians } from "@/features/technicians/hooks";

type Props = {
  interventions: Intervention[];
  technicianUid: string;
  onTechnicianChange: (uid: string) => void;
  dateYmd: string;
  onDateChange: (date: string) => void;
  onSchedule: (interventionId: string, time: string) => void;
  excludeInterventionId?: string;
};

export default function ScheduleDragBoard({
  interventions,
  technicianUid,
  onTechnicianChange,
  dateYmd,
  onDateChange,
  onSchedule,
  excludeInterventionId,
}: Props) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("pwaV2Bundle");
  const { technicians } = useTechnicians();
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);

  const unassigned = useMemo(
    () =>
      interventions.filter(
        (iv) =>
          isInterventionPendingBackOfficeIntake(iv) &&
          !iv.assignedTechnicianUid?.trim() &&
          iv.id !== excludeInterventionId
      ),
    [interventions, excludeInterventionId]
  );

  const freeSlots = useMemo(() => {
    if (!technicianUid.trim()) return [];
    return proposeAvailableSlotsForTechnician({
      interventions,
      technicianUid,
      dateYmd,
      excludeInterventionId,
    }).map((s) => s.time);
  }, [interventions, technicianUid, dateYmd, excludeInterventionId]);

  if (!enabled || !technicianUid.trim()) return null;

  const handleDrop = (time: string) => {
    if (!dragId) return;
    onSchedule(dragId, time);
    setDragId(null);
    setHoverSlot(null);
  };

  return (
    <section
      data-testid="schedule-drag-board"
      className="rounded-[14px] border border-blue-100 bg-blue-50/40 p-3"
    >
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-blue-800">
        {t("scheduling.drag_board.title")}
      </p>
      <label className="mb-2 block">
        <span className="mb-1 block text-xs font-semibold text-slate-600">
          {t("scheduling.drag_board.technician")}
        </span>
        <select
          data-testid="schedule-drag-board-technician"
          value={technicianUid}
          onChange={(e) => onTechnicianChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">{t("scheduling.drag_board.pick_technician")}</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.name || tech.id}
            </option>
          ))}
        </select>
      </label>
      <label className="mb-2 block">
        <span className="sr-only">{String(t("scheduling.proposed_slots.date_label"))}</span>
        <input
          type="date"
          data-testid="schedule-drag-board-date"
          value={dateYmd}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
        />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-600">
            {t("scheduling.drag_board.unassigned")}
          </p>
          <ul className="max-h-36 space-y-1 overflow-y-auto" data-testid="schedule-drag-sources">
            {unassigned.length === 0 ? (
              <li className="text-xs text-slate-500">{t("scheduling.drag_board.no_unassigned")}</li>
            ) : (
              unassigned.map((iv) => (
                <li key={iv.id}>
                  <div
                    draggable
                    data-testid={`schedule-drag-source-${iv.id}`}
                    onDragStart={() => setDragId(iv.id)}
                    onDragEnd={() => setDragId(null)}
                    className="flex cursor-grab items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs active:cursor-grabbing"
                  >
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {iv.title || iv.problem || iv.id}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold text-slate-600">
            {t("scheduling.drag_board.drop_slots")}
          </p>
          <div className="flex flex-wrap gap-1.5" data-testid="schedule-drag-slots">
            {SCHEDULING_WORK_SLOTS.map((time) => {
              const free = freeSlots.includes(time);
              const active = hoverSlot === time;
              return (
                <button
                  key={time}
                  type="button"
                  data-testid={`schedule-drag-slot-${time}`}
                  disabled={!free || !dragId}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (free) setHoverSlot(time);
                  }}
                  onDragLeave={() => setHoverSlot(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (free) handleDrop(time);
                  }}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-bold transition",
                    free
                      ? active
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-emerald-200 bg-white text-emerald-800"
                      : "border-slate-100 bg-slate-100 text-slate-400"
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">{t("scheduling.drag_board.hint")}</p>
        </div>
      </div>
    </section>
  );
}
