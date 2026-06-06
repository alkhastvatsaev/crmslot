"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HUB_SURFACE } from "@/core/ui/hub/hubTheme";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Surface tone inside glass rails */
  tone?: "default" | "muted" | "info" | "warning" | "dashed";
  padding?: "none" | "sm" | "md";
};

const toneClass = {
  default: HUB_SURFACE.card,
  muted: "rounded-[16px] border border-slate-100 bg-slate-50",
  info: "rounded-[16px] border border-blue-100 bg-blue-50/50",
  warning: "rounded-[16px] border border-amber-200/90 bg-amber-50/80",
  dashed: "rounded-[16px] border border-dashed border-slate-200 bg-slate-50/70",
} as const;

const paddingClass = {
  none: "",
  sm: "p-3",
  md: "p-4",
} as const;

export default function HubCard({
  children,
  tone = "default",
  padding = "md",
  className,
  ...rest
}: Props) {
  return (
    <div
      className={cn(
        tone === "default" ? HUB_SURFACE.card : toneClass[tone],
        paddingClass[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
