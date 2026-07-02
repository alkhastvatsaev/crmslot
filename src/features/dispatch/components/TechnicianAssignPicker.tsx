"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions";
import type { AssignScheduleOverride } from "@/features/interventions";
import ProposedScheduleSlots from "@/features/scheduling/components/ProposedScheduleSlots";
import ScheduleConflictBanner from "@/features/scheduling/components/ScheduleConflictBanner";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useTechnicianAssignPicker } from "@/features/dispatch/hooks/useTechnicianAssignPicker";
import TechnicianAssignPickerFooter from "@/features/dispatch/components/TechnicianAssignPickerFooter";
import TechnicianAssignPickerHeader from "@/features/dispatch/components/TechnicianAssignPickerHeader";
import TechnicianAssignPickerOption from "@/features/dispatch/components/TechnicianAssignPickerOption";
import MissionKitBadge from "@/features/missionKit/components/MissionKitBadge";
import { useMissionKit } from "@/features/missionKit/hooks/useMissionKit";

type Props = {
  intervention: Pick<
    Intervention,
    | "id"
    | "title"
    | "category"
    | "companyId"
    | "location"
    | "address"
    | "problem"
    | "requestedDate"
    | "requestedTime"
    | "scheduledDate"
    | "scheduledTime"
  >;
  peerInterventions?: Intervention[];
  /** Toutes les interventions de la société — pour calculer les scores de performance. */
  allInterventions?: Intervention[];
  onAssign: (technicianUid: string, schedule?: AssignScheduleOverride) => void | Promise<void>;
  onCancel: () => void;
  isAssigning?: boolean;
  /** Permet au parent (tiroir inbox) de forcer la hauteur disponible. */
  className?: string;
  /** Créneaux gérés ailleurs (ex. « Modifier » back-office) — liste techniciens seule. */
  techniciansOnly?: boolean;
};

export default function TechnicianAssignPicker({
  intervention,
  peerInterventions = [],
  allInterventions,
  onAssign,
  onCancel,
  isAssigning = false,
  className,
  techniciansOnly = false,
}: Props) {
  const { t } = useTranslation();
  const missionKitEnabled = useFeatureFlag("missionKit");
  const picker = useTechnicianAssignPicker({
    intervention,
    peerInterventions,
    allInterventions,
    onAssign,
    isAssigning,
    techniciansOnly,
    t,
  });

  const selectedTechnicianUid =
    picker.ranked.find((row) => row.technician.id === picker.selectedId)?.technician.authUid ??
    picker.selectedId;

  const missionKit = useMissionKit({
    enabled: missionKitEnabled,
    intervention,
    peerInterventions: allInterventions ?? peerInterventions,
    technicianUid: selectedTechnicianUid,
  });

  const footer = (
    <TechnicianAssignPickerFooter
      cancelLabel={String(t("dispatch.assign_picker.cancel"))}
      confirmLabel={String(t("dispatch.assign_picker.confirm"))}
      etaLoadingLabel={String(t("dispatch.assign_picker.eta_loading"))}
      confirmDisabled={picker.confirmDisabled}
      isAssigning={isAssigning}
      etaLoading={picker.etaLoading}
      onCancel={onCancel}
      onConfirm={picker.handleConfirm}
    />
  );

  return (
    <div
      data-testid="technician-assign-picker"
      className={cn(
        "flex min-h-0 flex-col rounded-[18px] border border-slate-200/80 bg-slate-50/90 p-4 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.18)]",
        className
      )}
    >
      <TechnicianAssignPickerHeader
        title={String(t("dispatch.assign_picker.title"))}
        address={intervention.address}
        cancelLabel={String(t("dispatch.assign_picker.cancel"))}
        onCancel={onCancel}
      />

      {missionKitEnabled ? (
        <div className="mb-3 shrink-0">
          <MissionKitBadge kit={missionKit.kit} loading={missionKit.loading} />
        </div>
      ) : null}

      {picker.loading ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {String(t("dispatch.assign_picker.loading"))}
          </div>
          {footer}
        </div>
      ) : picker.ranked.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <p className="flex-1 py-4 text-center text-sm text-slate-500">
            {String(t("dispatch.assign_picker.no_technicians"))}
          </p>
          {footer}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5">
            <ScheduleConflictBanner conflicts={picker.selectedConflicts} />
            {!techniciansOnly && picker.selectedId ? (
              <ProposedScheduleSlots
                dateYmd={picker.scheduleDate}
                onDateChange={picker.handleScheduleDateChange}
                slots={picker.proposedSlots}
                selectedTime={picker.selectedSlotTime}
                onSelectTime={picker.setSelectedSlotTime}
              />
            ) : null}
            <ul className="space-y-2 py-0.5">
              {picker.ranked.map(({ technician, distanceKm }) => (
                <TechnicianAssignPickerOption
                  key={technician.id}
                  technician={technician}
                  distanceKm={distanceKm}
                  isSelected={picker.selectedId === technician.id}
                  isRecommended={picker.recommendedId === technician.id}
                  eta={picker.etaByTechId[technician.id] ?? technician.realEta}
                  aiReasoning={picker.recommendedId === technician.id ? picker.aiReasoning : null}
                  aiRevenueImpact={
                    picker.recommendedId === technician.id ? picker.aiRevenueImpact : null
                  }
                  recommendedLabel={String(t("dispatch.assign_picker.recommended"))}
                  t={t}
                  onSelect={() => picker.setSelectedId(technician.id)}
                />
              ))}
            </ul>
          </div>
          {footer}
        </div>
      )}
    </div>
  );
}
