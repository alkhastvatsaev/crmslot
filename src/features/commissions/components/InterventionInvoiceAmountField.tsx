"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { auth, firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { computeAndPersistInterventionCommission } from "@/features/commissions/computeInterventionCommission";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  intervention: Pick<
    Intervention,
    "id" | "status" | "companyId" | "assignedTechnicianUid" | "invoiceAmountCents"
  >;
};

export default function InterventionInvoiceAmountField({ intervention }: Props) {
  const { t } = useTranslation();
  const euros =
    typeof intervention.invoiceAmountCents === "number" && intervention.invoiceAmountCents > 0
      ? (intervention.invoiceAmountCents / 100).toFixed(2)
      : "150.00";
  const [amount, setAmount] = useState(euros);
  const [busy, setBusy] = useState(false);

  if (intervention.status !== "done" && intervention.status !== "invoiced") return null;

  const save = async () => {
    if (!firestore) return;
    const parsed = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error(String(t("commissions.invoice_amount_invalid")));
      return;
    }
    const cents = Math.round(parsed * 100);
    setBusy(true);
    try {
      await updateDoc(doc(firestore, "interventions", intervention.id), {
        invoiceAmountCents: cents,
      });
      await computeAndPersistInterventionCommission({
        db: firestore,
        interventionId: intervention.id,
        companyId: intervention.companyId ?? null,
        technicianUid: intervention.assignedTechnicianUid ?? null,
        invoiceAmountCents: cents,
        auditByUid: auth?.currentUser?.uid?.trim() ?? "system",
      });
      toast.success(String(t("commissions.invoice_amount_saved")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="intervention-invoice-amount-field"
      className="flex flex-wrap items-end gap-2 rounded-[14px] border border-slate-100 bg-white p-3"
    >
      <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {t("commissions.invoice_amount_label")}
        <input
          type="number"
          min={0}
          step="0.01"
          data-testid="invoice-amount-input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-28 rounded-[10px] border border-slate-200 px-2 py-1.5 text-[14px] font-semibold text-slate-800"
        />
      </label>
      <button
        type="button"
        data-testid="invoice-amount-save"
        disabled={busy}
        onClick={() => void save()}
        className="rounded-[10px] bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {busy ? t("commissions.dashboard.saving") : t("common.save")}
      </button>
    </div>
  );
}
