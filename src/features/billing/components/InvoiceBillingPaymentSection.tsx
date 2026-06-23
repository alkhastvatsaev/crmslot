"use client";

import { cn } from "@/lib/utils";
import { formatBillingDate, STATUS_STYLES } from "@/features/billing/invoiceBillingPanelUtils";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/features/billing/invoiceBillingPanelTypes";
import type { Intervention } from "@/features/interventions";

type Props = {
  intervention: Intervention;
  paymentStatus: PaymentStatus;
  statusLabels: Record<PaymentStatus, string>;
  saving: boolean;
  invoicedAtLabel: string;
  paidAtLabel: string;
  paymentStatusLabel: string;
  onStatusChange: (status: PaymentStatus) => void;
};

export default function InvoiceBillingPaymentSection({
  intervention,
  paymentStatus,
  statusLabels,
  saving,
  invoicedAtLabel,
  paidAtLabel,
  paymentStatusLabel,
  onStatusChange,
}: Props) {
  return (
    <>
      {intervention.invoicedAt ? (
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {invoicedAtLabel}
          </span>
          <span className="text-[12px] text-slate-600">
            {formatBillingDate(intervention.invoicedAt)}
          </span>
        </div>
      ) : null}
      {intervention.paidAt ? (
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {paidAtLabel}
          </span>
          <span className="text-[12px] text-slate-600">
            {formatBillingDate(intervention.paidAt)}
          </span>
        </div>
      ) : null}

      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
          {paymentStatusLabel}
        </span>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={saving || paymentStatus === s}
              onClick={() => void onStatusChange(s)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold transition-all",
                paymentStatus === s
                  ? (STATUS_STYLES[s] ?? "bg-slate-100 text-slate-500") +
                      " ring-2 ring-offset-1 ring-current"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50"
              )}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
