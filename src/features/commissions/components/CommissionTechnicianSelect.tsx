"use client";

import { useMemo } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useTechnicians } from "@/features/technicians/hooks";
import {
  canResolveTechnicianAssignUid,
  resolveTechnicianAssignUid,
} from "@/features/dispatch/technicianAssignUid";

type Props = {
  value: string;
  onChange: (uid: string) => void;
  testId?: string;
  className?: string;
};

export default function CommissionTechnicianSelect({
  value,
  onChange,
  testId = "commission-technician-select",
  className,
}: Props) {
  const { t } = useTranslation();
  const { technicians, loading } = useTechnicians();

  const options = useMemo(
    () =>
      technicians
        .filter((tech) => canResolveTechnicianAssignUid(tech))
        .map((tech) => ({
          uid: resolveTechnicianAssignUid(tech),
          label: tech.name,
        })),
    [technicians],
  );

  return (
    <select
      data-testid={testId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading || options.length === 0}
      className={
        className ??
        "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
      }
    >
      <option value="">{String(t("commissions.dashboard.select_technician"))}</option>
      {options.map((opt) => (
        <option key={opt.uid} value={opt.uid}>
          {opt.label} ({opt.uid.slice(0, 8)}…)
        </option>
      ))}
    </select>
  );
}
