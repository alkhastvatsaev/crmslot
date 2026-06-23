"use client";

import { Badge } from "@/components/ui/badge";
import type { Intervention } from "@/features/interventions";
import {
  formatScheduledLabel,
  interventionClientLabel,
  statusLabelKey,
} from "@/features/interventions/technicianSchedule";

export default function CalendarInterventionSlotRow({
  iv,
  t,
}: {
  iv: Intervention;
  t: (key: string) => string;
}) {
  return (
    <li
      data-testid={`calendar-slot-${iv.id}`}
      title={`Dossier ${iv.id}`}
      className="rounded-2xl border border-black/[0.05] bg-white/95 px-3 py-2.5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.12)]"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 leading-snug text-[14px] font-semibold tracking-tight text-slate-900">
          {interventionClientLabel(iv)}
        </p>
        <Badge
          variant="secondary"
          className="max-w-[6.5rem] shrink-0 truncate text-[10px] font-semibold"
        >
          {String(t(statusLabelKey(iv.status)))}
        </Badge>
      </div>
      <p className="mt-1.5 text-[12px] font-medium text-slate-500">{formatScheduledLabel(iv)}</p>
      <p className="sr-only">Dossier {iv.id}</p>
    </li>
  );
}
