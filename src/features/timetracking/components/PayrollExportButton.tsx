"use client";

import { Download } from "lucide-react";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useTranslation } from "@/core/i18n/I18nContext";
import { auth } from "@/core/config/firebase";
import { useCompanyTimeEntries, useTimeEntries } from "../hooks/useTimeEntries";
import { downloadPayrollCsv } from "../exportPayrollCsv";

type Props = {
  /** Export société (back-office) ou feuilles du technicien connecté. */
  scope?: "technician" | "company";
};

export default function PayrollExportButton({ scope = "technician" }: Props) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("unifiedFieldCockpit");
  const uid = auth?.currentUser?.uid?.trim() ?? "";
  const technicianEntries = useTimeEntries(scope === "technician" ? uid : null);
  const companyEntries = useCompanyTimeEntries(scope === "company" && enabled);
  const entries = scope === "company" ? companyEntries : technicianEntries;

  if (!enabled) return null;
  if (scope === "technician" && !uid) return null;

  return (
    <button
      type="button"
      data-testid="payroll-export-button"
      onClick={() => downloadPayrollCsv(entries)}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
    >
      <Download className="h-3.5 w-3.5" />
      {t("timetracking.export_payroll")}
    </button>
  );
}
