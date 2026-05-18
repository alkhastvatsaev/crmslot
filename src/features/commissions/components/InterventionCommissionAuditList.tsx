"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  subscribeCommissionAudit,
  type CommissionAuditRow,
} from "@/features/commissions/commissionFirestore";
import { formatCommissionAuditAt } from "@/features/commissions/formatCommissionAuditAt";

type Props = {
  interventionId: string;
};

export default function InterventionCommissionAuditList({ interventionId }: Props) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<CommissionAuditRow[]>([]);

  useEffect(() => {
    if (!interventionId.trim() || !firestore) {
      setRows([]);
      return () => {};
    }
    return subscribeCommissionAudit(firestore, interventionId.trim(), setRows);
  }, [interventionId]);

  if (rows.length === 0) return null;

  return (
    <div data-testid="intervention-commission-audit-list" className="mt-3 space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {t("commissions.audit_title")}
      </span>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li
            key={row.id}
            data-testid={`intervention-commission-audit-${row.id}`}
            className="rounded-lg border border-slate-100 bg-white px-2.5 py-2 text-[12px] text-slate-700"
          >
            <div className="flex justify-between gap-2">
              <span className="font-semibold">
                {t(`commissions.dashboard.history.iv_action.${row.action}`)} —{" "}
                {row.finalCommissionAmount.toFixed(2)} €
              </span>
              <span className="shrink-0 text-slate-400">{formatCommissionAuditAt(row.at)}</span>
            </div>
            {row.reason ? (
              <p className="mt-0.5 text-slate-500">{row.reason}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
