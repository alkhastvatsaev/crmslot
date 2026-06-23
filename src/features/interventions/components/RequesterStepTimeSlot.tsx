"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import { SmartTimeSlotPicker } from "@/features/interventions/components/SmartTimeSlotPicker";

type Props = {
  tenantCompanyId: string | null;
  interventionDate: string;
  interventionTime: string;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
};

export default function RequesterStepTimeSlot({
  tenantCompanyId,
  interventionDate,
  interventionTime,
  onDateSelect,
  onTimeSelect,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-xl font-bold text-slate-800 px-2">
        {String(t("smart_form.step4.title"))}
      </h2>
      <SmartTimeSlotPicker
        companyId={tenantCompanyId}
        selectedDate={interventionDate || ""}
        selectedTime={interventionTime || ""}
        onDateSelect={onDateSelect}
        onTimeSelect={onTimeSelect}
      />
    </div>
  );
}
