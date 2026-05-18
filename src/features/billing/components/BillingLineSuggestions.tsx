"use client";

import { Sparkles } from "lucide-react";
import type { BillingLineSuggestion } from "../smartBillingTemplates";

interface Props {
  suggestions: BillingLineSuggestion[];
  onApply: (suggestion: BillingLineSuggestion) => void;
}

export default function BillingLineSuggestions({ suggestions, onApply }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-600">
        <Sparkles className="h-3.5 w-3.5" />
        Suggestions basées sur l&apos;historique
      </div>
      <ul className="space-y-1">
        {suggestions.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onApply(s)}
              className="w-full flex items-center justify-between rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-left hover:bg-violet-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{s.description}</p>
                <p className="text-xs text-slate-500">
                  Qté {s.quantity} · {(s.unitPriceCents / 100).toFixed(2)} € · {s.frequency}× utilisé
                </p>
              </div>
              <span className="ml-2 text-xs font-bold text-violet-600 shrink-0">+ Ajouter</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
