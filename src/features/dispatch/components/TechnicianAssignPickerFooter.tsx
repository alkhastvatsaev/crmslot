"use client";

import { Loader2 } from "lucide-react";

type Props = {
  cancelLabel: string;
  confirmLabel: string;
  etaLoadingLabel: string;
  confirmDisabled: boolean;
  isAssigning: boolean;
  etaLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function TechnicianAssignPickerFooter({
  cancelLabel,
  confirmLabel,
  etaLoadingLabel,
  confirmDisabled,
  isAssigning,
  etaLoading,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div className="flex shrink-0 gap-2 border-t border-slate-100 bg-slate-50/95 pt-3">
      <button
        type="button"
        data-testid="technician-assign-picker-cancel-footer"
        onClick={onCancel}
        className="flex-1 rounded-[12px] border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        data-testid="technician-assign-confirm"
        disabled={confirmDisabled}
        onClick={onConfirm}
        className="flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {confirmLabel}
        {etaLoading ? <span className="sr-only">{etaLoadingLabel}</span> : null}
      </button>
    </div>
  );
}
