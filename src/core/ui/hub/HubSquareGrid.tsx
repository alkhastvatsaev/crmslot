"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type HubSquareTileTone = "default" | "active" | "success" | "warning" | "muted" | "danger";

export type HubSquareTile = {
  id: string;
  primary: string;
  secondary?: string;
  tone?: HubSquareTileTone;
  testId?: string;
};

type Props = {
  tiles: HubSquareTile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  /** Nombre minimum de cases (emplacements vides comme page 0 / DailyMissions). */
  minSlots?: number;
  testId?: string;
  /** compact = panneau gauche carte (95px) · standard = hubs patron (108px). */
  size?: "compact" | "standard";
};

const TONE_RING: Record<HubSquareTileTone, string> = {
  default: "border-black/[0.06] ring-slate-200/80",
  active: "border-amber-200/80 ring-amber-200/60",
  success: "border-emerald-200/80 ring-emerald-200/60",
  warning: "border-amber-200/80 ring-amber-200/60",
  muted: "border-black/[0.06] ring-slate-200/80 opacity-90",
  danger: "border-red-200/80 ring-red-200/60",
};

function EmptySlot({ index, size }: { index: number; size: "compact" | "standard" }) {
  return (
    <div
      data-testid={`hub-square-empty-${index}`}
      aria-hidden
      className={cn(
        "w-full justify-self-center rounded-[24px] border border-black/[0.06] bg-white/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),0_4px_14px_-6px_rgba(15,23,42,0.08)]",
        size === "compact" ? "aspect-square max-w-[95px]" : "min-h-[108px]"
      )}
    />
  );
}

/** Grille de carrés — même langage visuel que DailyMissions (page 0, panneau gauche). */
export default function HubSquareGrid({
  tiles,
  selectedId,
  onSelect,
  loading = false,
  emptyMessage,
  minSlots = 12,
  testId = "hub-square-grid",
  size = "compact",
}: Props) {
  if (loading) {
    return (
      <div
        data-testid={`${testId}-loading`}
        className="flex min-h-[120px] flex-1 items-center justify-center"
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  if (tiles.length === 0 && emptyMessage) {
    return (
      <div
        data-testid={`${testId}-empty`}
        className="flex flex-1 items-center justify-center px-4 text-center text-sm text-slate-400"
      >
        {emptyMessage}
      </div>
    );
  }

  const trailingEmpty = Math.max(0, minSlots - tiles.length);

  return (
    <div
      data-testid={testId}
      className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-4"
    >
      <div className="grid grid-cols-3 gap-3 content-start [grid-template-columns:repeat(3,minmax(0,1fr))]">
        {tiles.map((tile) => {
          const active = selectedId === tile.id;
          const tone = tile.tone ?? "default";

          return (
            <button
              key={tile.id}
              type="button"
              data-testid={tile.testId ?? `hub-square-${tile.id}`}
              onClick={() => onSelect(tile.id)}
              className={cn(
                "group relative flex w-full flex-col items-center justify-center gap-1 rounded-[24px] border bg-white/95 p-3 text-center shadow-[0_6px_18px_-4px_rgba(15,23,42,0.1)] transition hover:scale-[1.02] active:scale-[0.96]",
                size === "compact"
                  ? "aspect-square max-w-[95px] justify-self-center"
                  : "min-h-[108px]",
                active ? "border-slate-900 ring-2 ring-slate-900/15" : cn("ring-1", TONE_RING[tone])
              )}
            >
              <span className="line-clamp-2 w-full text-[13px] font-bold leading-tight tracking-[-0.02em] text-slate-900">
                {tile.primary}
              </span>
              {tile.secondary ? (
                <span className="text-[12px] font-medium tabular-nums text-slate-500">
                  {tile.secondary}
                </span>
              ) : null}
            </button>
          );
        })}
        {trailingEmpty > 0
          ? Array.from({ length: trailingEmpty }, (_, i) => (
              <EmptySlot key={`empty-${i}`} index={tiles.length + i} size={size} />
            ))
          : null}
      </div>
    </div>
  );
}
