"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  testId: string;
  children: ReactNode;
  className?: string;
  badge?: string;
};

/** En-tête + zone scrollable dans un rail GlassPanel du hub back-office. */
export default function BackOfficeHubPanelShell({ title, testId, children, className, badge }: Props) {
  return (
    <div
      data-testid={testId}
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <div className="flex shrink-0 items-center gap-2 px-1 pb-3">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</h2>
        {badge ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">{children}</div>
    </div>
  );
}
