"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { HUB_FOCUS_RING, HUB_TYPE } from "@/core/ui/hub/hubTheme";

type Props = {
  title: ReactNode;
  onBack: () => void;
  backLabel?: string;
  rightAction?: ReactNode;
  className?: string;
};

export default function HubDetailHeader({
  title,
  onBack,
  backLabel,
  rightAction,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4",
        className
      )}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200",
          HUB_FOCUS_RING
        )}
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h3 className={cn("px-2 text-center", HUB_TYPE.title)}>{title}</h3>
      {rightAction ?? <div className="h-9 w-9 shrink-0" aria-hidden />}
    </div>
  );
}
