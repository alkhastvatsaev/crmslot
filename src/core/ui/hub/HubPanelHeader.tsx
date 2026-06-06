"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HUB_RADIUS, HUB_TYPE } from "@/core/ui/hub/hubTheme";

type Props = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  badge?: string;
  icon?: ReactNode;
  className?: string;
  /** `eyebrow` = rail section label. `page` = larger title with optional icon. */
  variant?: "eyebrow" | "page";
};

export default function HubPanelHeader({
  title,
  subtitle,
  eyebrow,
  badge,
  icon,
  className,
  variant = "eyebrow",
}: Props) {
  const showEyebrow = variant === "eyebrow" && Boolean(title?.trim() || badge);
  const showPage = variant === "page" && Boolean(title?.trim());

  if (!showEyebrow && !showPage) return null;

  if (variant === "page") {
    return (
      <header className={cn("flex shrink-0 flex-col gap-3", className)}>
        <div className="flex items-center gap-2.5">
          {icon ? (
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center bg-slate-900 text-white",
                HUB_RADIUS.icon,
                "shadow-[0_8px_20px_-8px_rgba(15,23,42,0.45)]"
              )}
            >
              {icon}
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className={cn("truncate", HUB_TYPE.titleLg)}>{title}</h2>
            {subtitle ? <p className="text-[13px] font-medium text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
      </header>
    );
  }

  return (
    <div className={cn("flex shrink-0 items-center gap-2 px-1 pb-3", className)}>
      {title?.trim() ? <h2 className={HUB_TYPE.eyebrow}>{title}</h2> : null}
      {badge ? (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
