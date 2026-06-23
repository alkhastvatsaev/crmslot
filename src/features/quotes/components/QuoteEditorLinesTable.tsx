"use client";

import { Plus, Trash2 } from "lucide-react";
import type { QuoteLine } from "@/features/quotes/types";

type Props = {
  lines: QuoteLine[];
  colDescription: string;
  colQty: string;
  colPrice: string;
  linePlaceholder: string;
  addLineLabel: string;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
  onUpdateLine: (index: number, patch: Partial<QuoteLine>) => void;
};

export default function QuoteEditorLinesTable({
  lines,
  colDescription,
  colQty,
  colPrice,
  linePlaceholder,
  addLineLabel,
  onAddLine,
  onRemoveLine,
  onUpdateLine,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_60px_80px_32px] gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
        <span>{colDescription}</span>
        <span className="text-right">{colQty}</span>
        <span className="text-right">{colPrice}</span>
        <span />
      </div>
      {lines.map((line, i) => (
        <div key={i} className="grid grid-cols-[1fr_60px_80px_32px] gap-1 items-center">
          <input
            data-testid={`quote-line-desc-${i}`}
            value={line.description}
            onChange={(e) => onUpdateLine(i, { description: e.target.value })}
            placeholder={linePlaceholder}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
          <input
            data-testid={`quote-line-qty-${i}`}
            type="number"
            min={1}
            value={line.quantity}
            onChange={(e) => onUpdateLine(i, { quantity: Math.max(1, Number(e.target.value)) })}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right"
          />
          <input
            data-testid={`quote-line-price-${i}`}
            type="number"
            min={0}
            step={0.01}
            value={(line.unitPriceCents / 100).toFixed(2)}
            onChange={(e) =>
              onUpdateLine(i, { unitPriceCents: Math.round(Number(e.target.value) * 100) })
            }
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right"
          />
          <button
            type="button"
            onClick={() => onRemoveLine(i)}
            disabled={lines.length === 1}
            data-testid={`quote-line-remove-${i}`}
            className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAddLine}
        data-testid="quote-add-line"
        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
      >
        <Plus className="h-3.5 w-3.5" />
        {addLineLabel}
      </button>
    </div>
  );
}
