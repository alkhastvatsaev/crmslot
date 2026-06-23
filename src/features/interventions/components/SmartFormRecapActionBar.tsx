"use client";

import React from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  urgency: boolean;
  setUrgency: (fn: (prev: boolean) => boolean) => void;
  canSubmit: boolean;
  busy: boolean;
  onSubmit: () => void;
};

export default function SmartFormRecapActionBar({
  urgency,
  setUrgency,
  canSubmit,
  busy,
  onSubmit,
}: Props) {
  return (
    <div className="relative z-10 mt-2 flex shrink-0 flex-row gap-1.5 pt-1">
      <button
        type="button"
        data-testid="smart-form-urgency"
        aria-pressed={urgency}
        aria-label={urgency ? "Demande marquée urgente" : "Marquer comme urgent"}
        title={urgency ? "Urgent" : "Marquer comme urgent"}
        onClick={() => setUrgency((u) => !u)}
        className={cn(
          "inline-flex min-h-[34px] min-w-0 flex-1 items-center justify-center rounded-[10px] shadow-[0_10px_28px_-22px_rgba(15,23,42,0.4)] backdrop-blur-sm transition ring-1 active:scale-[0.97]",
          urgency
            ? "border-transparent bg-red-50 text-red-700 ring-red-300/35"
            : "border-transparent bg-gradient-to-b from-white/98 to-slate-50/92 text-slate-600 ring-black/[0.06] hover:from-white hover:to-white"
        )}
      >
        <span className="text-[13px] font-semibold uppercase tracking-wide">Urgent</span>
      </button>

      <button
        type="button"
        data-testid="smart-form-submit"
        aria-label={busy ? "Envoi en cours" : "Envoyer la demande"}
        title="Envoyer la demande"
        disabled={!canSubmit || busy}
        onClick={onSubmit}
        className="inline-flex min-h-[34px] min-w-0 flex-1 items-center justify-center rounded-[10px] bg-slate-900 text-white shadow-[0_16px_36px_-16px_rgba(15,23,42,0.5)] ring-1 ring-white/10 transition hover:bg-slate-800 enabled:active:scale-[0.97] disabled:opacity-40"
      >
        {busy ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
        ) : (
          <SendHorizontal className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
        )}
      </button>
    </div>
  );
}
