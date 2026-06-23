"use client";

import { formatQuoteEur } from "@/features/quotes/quoteEditorPanelUtils";

type Props = {
  totalHT: number;
  tva: number;
  totalTTC: number;
  totalHtLabel: string;
  tvaLabel: string;
  totalTtcLabel: string;
};

export default function QuoteEditorTotals({
  totalHT,
  tva,
  totalTTC,
  totalHtLabel,
  tvaLabel,
  totalTtcLabel,
}: Props) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2 space-y-1 text-xs">
      <div className="flex justify-between text-slate-500">
        <span>{totalHtLabel}</span>
        <span>{formatQuoteEur(totalHT)}</span>
      </div>
      <div className="flex justify-between text-slate-500">
        <span>{tvaLabel}</span>
        <span>{formatQuoteEur(tva)}</span>
      </div>
      <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 mt-1">
        <span>{totalTtcLabel}</span>
        <span>{formatQuoteEur(totalTTC)}</span>
      </div>
    </div>
  );
}
