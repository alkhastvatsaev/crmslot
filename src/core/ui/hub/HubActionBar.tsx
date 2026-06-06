"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Full-height picker mode (assign technician). */
  fill?: boolean;
};

export default function HubActionBar({ children, className, fill = false }: Props) {
  return (
    <div
      className={cn(
        "shrink-0 border-t border-slate-100 bg-white/80 backdrop-blur-md",
        fill ? "flex min-h-0 flex-1 flex-col p-4" : "flex gap-3 p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
