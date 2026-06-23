"use client";

import { billingLinesTotalCents, formatEur } from "@/features/billing/invoiceBillingPanelUtils";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  billingLines: NonNullable<Intervention["billingLines"]>;
};

export default function InvoiceBillingLinesTable({ billingLines }: Props) {
  const totalHT = billingLinesTotalCents(billingLines);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
      <div className="bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
        <span>Description</span>
        <span>Total</span>
      </div>
      <div className="divide-y divide-slate-100">
        {billingLines.map((line, idx) => (
          <div key={idx} className="px-3 py-2 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-slate-800">
                {line.description}{" "}
                {line.reference ? (
                  <span className="text-slate-400 text-[11px]">[{line.reference}]</span>
                ) : (
                  ""
                )}
              </span>
              <span className="text-[11px] text-slate-500">
                {line.quantity} × {formatEur(line.unitPriceCents)}
              </span>
            </div>
            <span className="text-[13px] font-bold text-slate-700">
              {formatEur(Math.round(line.quantity * line.unitPriceCents))}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-white px-3 py-3 border-t border-slate-200 flex flex-col items-end gap-1">
        <div className="text-[11px] font-semibold text-slate-500 flex justify-between w-full max-w-[150px]">
          <span>Total HT :</span>
          <span>{formatEur(totalHT)}</span>
        </div>
        <div className="text-[11px] font-semibold text-slate-500 flex justify-between w-full max-w-[150px]">
          <span>TVA (6%) :</span>
          <span>{formatEur(Math.round(totalHT * 0.06))}</span>
        </div>
        <div className="text-[14px] font-black text-blue-700 flex justify-between w-full max-w-[150px] mt-1 pt-1 border-t border-slate-100">
          <span>TTC :</span>
          <span>{formatEur(Math.round(totalHT * 1.06))}</span>
        </div>
      </div>
    </div>
  );
}
