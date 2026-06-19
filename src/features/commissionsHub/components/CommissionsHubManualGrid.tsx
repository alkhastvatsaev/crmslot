"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTechnicians } from "@/features/technicians/hooks";
import type { ManualCommissionEntry } from "@/features/commissions/commissionFirestore";

const GRID_MIN_SLOTS = 9;

type Props = {
  entries: ManualCommissionEntry[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function EmptySlot({ index }: { index: number }) {
  return (
    <div
      data-testid={`commissions-hub-manual-empty-${index}`}
      aria-hidden
      className="aspect-square w-full justify-self-center rounded-[24px] border border-black/[0.06] bg-white/40"
    />
  );
}

export default function CommissionsHubManualGrid({
  entries,
  loading,
  selectedId,
  onSelect,
}: Props) {
  const { technicians } = useTechnicians();

  const techName = (uid: string) =>
    technicians.find((tech) => tech.authUid === uid || tech.id === uid)?.name ??
    `…${uid.slice(-6)}`;

  const trailingEmpty =
    entries.length === 0 ? GRID_MIN_SLOTS : Math.max(0, GRID_MIN_SLOTS - entries.length);

  if (loading) {
    return (
      <div
        className="flex min-h-0 flex-1 items-center justify-center"
        data-testid="commissions-hub-manual-loading"
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div
      data-testid="commissions-hub-manual-grid"
      className="custom-scrollbar min-h-0 flex-1 overflow-y-auto"
    >
      <div className="grid grid-cols-3 gap-3 px-3 pb-6 pt-4 content-start">
        {entries.map((entry) => {
          const active = selectedId === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              data-testid={`commissions-hub-manual-${entry.id}`}
              onClick={() => onSelect(entry.id)}
              className={cn(
                "flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[24px] border bg-white/95 p-3 text-center shadow-[0_6px_18px_-4px_rgba(15,23,42,0.08)] transition hover:scale-[1.02] active:scale-[0.96]",
                active
                  ? "border-amber-600 ring-2 ring-amber-500/25"
                  : "border-black/[0.06] ring-1 ring-amber-200/80"
              )}
            >
              <span className="text-2xl font-bold tabular-nums text-amber-800">
                {entry.amountEuros.toFixed(0)} €
              </span>
              <span className="truncate text-[11px] font-medium text-slate-700">
                {techName(entry.technicianUid)}
              </span>
              <span className="line-clamp-2 text-[10px] text-slate-500">{entry.reason}</span>
            </button>
          );
        })}
        {Array.from({ length: trailingEmpty }, (_, i) => (
          <EmptySlot key={i} index={i} />
        ))}
      </div>
    </div>
  );
}
