"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  HUB_ACTIVE_ACCENT,
  HUB_BADGE_ACCENT,
  HUB_FOCUS_RING,
  HUB_RADIUS,
  HUB_SURFACE,
  HUB_TYPE,
  type HubActiveAccent,
  type HubBadgeAccent,
} from "@/core/ui/hub/hubTheme";

export type HubSegmentOption = {
  id: string;
  label: ReactNode;
  /** Infobulle / aria complémentaire (ex. libellé long). */
  title?: string;
  /** Count badge shown when > 0 */
  badge?: number;
  badgeAccent?: HubBadgeAccent;
  activeAccent?: HubActiveAccent;
  testId?: string;
  icon?: ReactNode;
};

type Props = {
  value: string;
  onChange: (id: string) => void;
  options: HubSegmentOption[];
  ariaLabel?: string;
  className?: string;
  /** `segmented` = pill track (default hub tabs). `scroll` = horizontal pill row. */
  layout?: "segmented" | "scroll";
  size?: "default" | "compact";
};

const pillSizeClass = {
  default: "min-h-[44px] px-2 py-2",
  compact: "min-h-[40px] px-2 py-1.5",
} as const;

export default function HubSegmentedControl({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  layout = "segmented",
  size = "default",
}: Props) {
  const isScroll = layout === "scroll";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      data-testid="hub-segmented-control"
      className={cn(
        "flex shrink-0 gap-1",
        isScroll
          ? "overflow-x-auto p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : HUB_SURFACE.track,
        className
      )}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        const accent = opt.activeAccent ?? "blue";
        const badgeAccent = opt.badgeAccent ?? "blue";
        const showBadge = typeof opt.badge === "number" && opt.badge > 0;

        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            title={opt.title}
            data-testid={opt.testId}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 transition-all",
              HUB_TYPE.segmentLabel,
              HUB_FOCUS_RING,
              isScroll
                ? cn(
                    HUB_RADIUS.pill,
                    "shrink-0 whitespace-nowrap px-3 py-2 text-[11px] font-semibold leading-none",
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200/80 hover:bg-slate-50"
                  )
                : cn(
                    HUB_RADIUS.control,
                    pillSizeClass[size],
                    active
                      ? cn("bg-white shadow-sm", HUB_ACTIVE_ACCENT[accent])
                      : "text-slate-500 hover:bg-slate-300/30"
                  )
            )}
          >
            {opt.icon}
            <span className="min-w-0 truncate text-center">{opt.label}</span>
            {showBadge ? (
              <span
                className={cn(
                  "flex h-4.5 min-w-[18px] items-center justify-center rounded-full border px-1 text-[9px] font-bold",
                  HUB_BADGE_ACCENT[badgeAccent]
                )}
              >
                {opt.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
