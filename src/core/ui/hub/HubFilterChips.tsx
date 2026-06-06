"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HUB_FOCUS_RING, HUB_RADIUS, HUB_TYPE } from "@/core/ui/hub/hubTheme";

export type HubFilterChipOption = {
  id: string;
  label: ReactNode;
  count?: number;
  testId?: string;
};

type Props = {
  value: string;
  onChange: (id: string) => void;
  options: HubFilterChipOption[];
  ariaLabel?: string;
  className?: string;
};

export default function HubFilterChips({ value, onChange, options, ariaLabel, className }: Props) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      data-testid="hub-filter-chips"
      className={cn("flex shrink-0 flex-wrap gap-1.5", className)}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={opt.testId}
            onClick={() => onChange(opt.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 transition",
              HUB_RADIUS.pill,
              HUB_TYPE.segmentLabel,
              "font-medium",
              HUB_FOCUS_RING,
              active
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-black/[0.08] hover:bg-slate-50"
            )}
          >
            <span>{opt.label}</span>
            {typeof opt.count === "number" ? (
              <span
                className={cn(
                  "min-w-[1.25rem] rounded-full px-1 text-center text-[10px] font-bold tabular-nums",
                  active ? "bg-white/20" : "bg-slate-100"
                )}
              >
                {opt.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
