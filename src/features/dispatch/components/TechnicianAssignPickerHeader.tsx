"use client";

import { MapPin, X } from "lucide-react";

type Props = {
  address?: string | null;
  title: string;
  cancelLabel: string;
  onCancel: () => void;
};

export default function TechnicianAssignPickerHeader({
  address,
  title,
  cancelLabel,
  onCancel,
}: Props) {
  return (
    <div className="mb-3 flex shrink-0 items-start justify-between gap-2">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {address ? (
          <p className="mt-0.5 flex items-start gap-1 text-xs text-slate-500">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-2">{address}</span>
          </p>
        ) : null}
      </div>
      <button
        type="button"
        data-testid="technician-assign-picker-cancel"
        onClick={onCancel}
        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        aria-label={cancelLabel}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
