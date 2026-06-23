"use client";

import { CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "@/features/billing/invoiceBillingPanelUtils";
import type { PaymentStatus } from "@/features/billing/invoiceBillingPanelTypes";

type Props = {
  expanded: boolean;
  panelTitle: string;
  paymentStatus: PaymentStatus;
  statusLabel: string;
  onToggle: () => void;
};

export default function InvoiceBillingPanelHeader({
  expanded,
  panelTitle,
  paymentStatus,
  statusLabel,
  onToggle,
}: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-[14px] bg-slate-50 px-4 py-3 border border-slate-100 hover:bg-slate-100/80 transition-colors"
    >
      <div className="flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-slate-500" />
        <span className="text-[12px] font-bold text-slate-700 uppercase tracking-widest">
          {panelTitle}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
            STATUS_STYLES[paymentStatus] ?? "bg-slate-100 text-slate-500"
          )}
        >
          {statusLabel}
        </span>
      </div>
      {expanded ? (
        <ChevronUp className="w-4 h-4 text-slate-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-400" />
      )}
    </button>
  );
}
