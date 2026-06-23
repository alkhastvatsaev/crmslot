import { useAvailableSlots } from "../hooks/useAvailableSlots";
import { SmartTimeSlotNextAvailabilities } from "@/features/interventions/components/SmartTimeSlotNextAvailabilities";
import { SmartTimeSlotSpecificDatePicker } from "@/features/interventions/components/SmartTimeSlotSpecificDatePicker";
import { useTranslation } from "@/core/i18n/I18nContext";

interface SmartTimeSlotPickerProps {
  companyId: string | null | undefined;
  selectedDate: string; // YYYY-MM-DD
  selectedTime: string; // HH:mm
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
}

export function SmartTimeSlotPicker({
  companyId,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
}: SmartTimeSlotPickerProps) {
  const { t } = useTranslation();
  const { bookedSlotsByDate, loading } = useAvailableSlots(companyId);

  return (
    <div className="flex flex-col gap-8 w-full">
      <SmartTimeSlotNextAvailabilities
        bookedSlotsByDate={bookedSlotsByDate}
        loading={loading}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onDateSelect={onDateSelect}
        onTimeSelect={onTimeSelect}
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-50 px-3 text-sm font-bold uppercase tracking-wide text-slate-400">
            {t("smart_time_slot.or")}
          </span>
        </div>
      </div>

      <SmartTimeSlotSpecificDatePicker
        bookedSlotsByDate={bookedSlotsByDate}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onDateSelect={onDateSelect}
        onTimeSelect={onTimeSelect}
      />
    </div>
  );
}
