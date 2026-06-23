"use client";

import { Send } from "lucide-react";
import { HubButton } from "@/core/ui/hub";

type Props = {
  rejectReason: string;
  rejectReasonLabel: string;
  rejectReasonPlaceholder: string;
  rejectSendLabel: string;
  cancelLabel: string;
  onRejectReasonChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function TerrainReportRejectForm({
  rejectReason,
  rejectReasonLabel,
  rejectReasonPlaceholder,
  rejectSendLabel,
  cancelLabel,
  onRejectReasonChange,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      data-testid="backoffice-reject-form"
      className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3"
    >
      <p className="text-[13px] font-bold text-amber-900">{rejectReasonLabel}</p>
      <textarea
        value={rejectReason}
        onChange={(e) => onRejectReasonChange(e.target.value)}
        placeholder={rejectReasonPlaceholder}
        rows={3}
        className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-amber-400 placeholder:text-slate-400 resize-none"
        autoFocus
      />
      <div className="flex gap-2">
        <HubButton
          type="button"
          variant="dangerOutline"
          data-testid="backoffice-reject-confirm"
          onClick={onConfirm}
          className="flex-1"
        >
          <Send className="h-4 w-4" />
          {rejectSendLabel}
        </HubButton>
        <HubButton type="button" onClick={onCancel} className="shrink-0">
          {cancelLabel}
        </HubButton>
      </div>
    </div>
  );
}
