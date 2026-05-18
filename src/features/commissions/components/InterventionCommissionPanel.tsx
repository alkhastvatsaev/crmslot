"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { auth, firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useInterventionCommission } from "@/features/commissions/useInterventionCommission";
import { saveCommissionOverride } from "@/features/commissions/commissionFirestore";
import { computeAndPersistInterventionCommission } from "@/features/commissions/computeInterventionCommission";
import InterventionCommissionAuditList from "@/features/commissions/components/InterventionCommissionAuditList";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  intervention: Pick<
    Intervention,
    | "id"
    | "status"
    | "companyId"
    | "assignedTechnicianUid"
    | "invoiceAmountCents"
    | "commissionAmountCents"
  >;
};

export default function InterventionCommissionPanel({ intervention }: Props) {
  const { t } = useTranslation();
  const { commission, loading } = useInterventionCommission(intervention.id);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const canShow =
    intervention.status === "done" ||
    intervention.status === "invoiced" ||
    Boolean(commission);

  const handleRecalculate = useCallback(async () => {
    if (!firestore) return;
    setBusy(true);
    try {
      const existing = commission?.isManualOverride ? commission : null;
      await computeAndPersistInterventionCommission({
        db: firestore,
        interventionId: intervention.id,
        companyId: intervention.companyId ?? null,
        technicianUid: intervention.assignedTechnicianUid ?? null,
        invoiceAmountCents: intervention.invoiceAmountCents,
        auditByUid: auth?.currentUser?.uid?.trim() ?? "system",
        existingOverride: existing,
      });
      toast.success(String(t("commissions.recalculated")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  }, [intervention, commission, t]);

  const handleOverride = async () => {
    if (!firestore || !commission) return;
    const uid = auth?.currentUser?.uid?.trim();
    if (!uid) return;
    const euros = Number(amount.replace(",", "."));
    if (!Number.isFinite(euros) || euros < 0) {
      toast.error(String(t("commissions.override_invalid")));
      return;
    }
    if (!reason.trim()) {
      toast.error(String(t("commissions.override_reason_required")));
      return;
    }
    setBusy(true);
    try {
      await saveCommissionOverride(
        firestore,
        intervention.companyId ?? "",
        {
          interventionId: intervention.id,
          baseAmount: commission.baseAmount,
          finalCommissionAmount: euros,
          appliedRuleId: null,
          isManualOverride: true,
          overrideReason: reason.trim(),
          overrideByUid: uid,
          updatedAt: new Date().toISOString(),
        },
        uid,
        reason.trim(),
      );
      setOverrideOpen(false);
      toast.success(String(t("commissions.override_saved")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  if (!canShow) return null;

  const displayCents =
    commission?.finalCommissionAmount != null
      ? Math.round(commission.finalCommissionAmount * 100)
      : intervention.commissionAmountCents;

  return (
    <div
      data-testid="intervention-commission-panel"
      className="space-y-2 rounded-[18px] border border-slate-100 bg-slate-50/80 p-4"
    >
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {t("commissions.panel_title")}
      </span>
      {loading && !commission ? (
        <p className="text-[12px] text-slate-400">{t("common.loading")}</p>
      ) : (
        <p className="text-[15px] font-semibold text-slate-800" data-testid="commission-amount-display">
          {displayCents != null
            ? `${(displayCents / 100).toFixed(2)} €`
            : String(t("commissions.not_calculated"))}
          {commission?.isManualOverride ? (
            <span className="ml-2 text-[11px] font-bold uppercase text-amber-700">
              {t("commissions.manual_override")}
            </span>
          ) : null}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="commission-recalculate"
          disabled={busy}
          onClick={() => void handleRecalculate()}
          className="rounded-[10px] bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 disabled:opacity-50"
        >
          {t("commissions.recalculate")}
        </button>
        <button
          type="button"
          data-testid="commission-override-open"
          disabled={busy || !commission}
          onClick={() => {
            setAmount(String(commission?.finalCommissionAmount ?? ""));
            setOverrideOpen((v) => !v);
          }}
          className="rounded-[10px] bg-white px-3 py-1.5 text-[11px] font-bold text-blue-600 ring-1 ring-blue-100 hover:bg-blue-50 disabled:opacity-50"
        >
          {t("commissions.override")}
        </button>
      </div>
      {overrideOpen ? (
        <div className="space-y-2 pt-2" data-testid="commission-override-form">
          <input
            type="number"
            min={0}
            step="0.01"
            data-testid="commission-override-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[13px]"
            placeholder={String(t("commissions.override_amount_placeholder"))}
          />
          <input
            type="text"
            data-testid="commission-override-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[13px]"
            placeholder={String(t("commissions.override_reason_placeholder"))}
          />
          <button
            type="button"
            data-testid="commission-override-save"
            disabled={busy}
            onClick={() => void handleOverride()}
            className="rounded-[10px] bg-blue-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {t("common.save")}
          </button>
        </div>
      ) : null}
      <InterventionCommissionAuditList interventionId={intervention.id} />
    </div>
  );
}
