"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import HubSquareGrid, { type HubSquareTileTone } from "@/core/ui/hub/HubSquareGrid";
import type { PlanningHubSlot } from "@/features/planningHub/planningHubTypes";

const SLOT_TONE: Record<PlanningHubSlot["kind"], HubSquareTileTone> = {
  free: "muted",
  busy: "default",
  conflict: "danger",
};

type Props = {
  slots: PlanningHubSlot[];
  selectedSlotTime: string | null;
  onSelectSlot: (time: string) => void;
};

/** Créneaux du jour — même grille carrée que DailyMissions (page 0). */
export default function PlanningHubSlotGrid({ slots, selectedSlotTime, onSelectSlot }: Props) {
  const { t } = useTranslation();
  const hasConflict = slots.some((s) => s.kind === "conflict");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <HubSquareGrid
        testId="planning-hub-slots"
        tiles={slots.map((slot) => ({
          id: slot.time,
          primary: slot.label,
          secondary: slot.time,
          tone: SLOT_TONE[slot.kind],
          testId: `planning-slot-${slot.time}`,
        }))}
        selectedId={selectedSlotTime}
        onSelect={onSelectSlot}
        minSlots={16}
        columns={4}
        size="compact"
      />
      {hasConflict ? (
        <p
          data-testid="planning-hub-conflict-alert"
          className="mx-4 mb-4 shrink-0 rounded-[16px] border border-red-200 bg-red-50 px-3 py-2 text-center text-[12px] text-red-800"
        >
          {t("planningHub.conflict_hint")}
        </p>
      ) : null}
    </div>
  );
}
