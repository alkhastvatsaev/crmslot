"use client";

import type { ReactNode } from "react";
import { Building2, CloudOff, Lock } from "lucide-react";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";

export function CompanySpacePanelShell({ children }: { children: ReactNode }) {
  return (
    <div data-testid="company-space-panel" className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex flex-col gap-3`}>{children}</div>
    </div>
  );
}

export function CompanySpaceOfflineGlyph({
  testId,
  ariaLabel,
  overlay: Overlay,
}: {
  testId: string;
  ariaLabel: string;
  overlay: typeof CloudOff | typeof Lock;
}) {
  return (
    <div
      data-testid={testId}
      aria-label={ariaLabel}
      className="flex flex-1 flex-col items-center justify-center py-14"
    >
      <div className="relative">
        <Building2 className="h-[4.5rem] w-[4.5rem] text-slate-300/90" aria-hidden />
        <Overlay
          className="absolute -bottom-0.5 -right-0.5 h-9 w-9 rounded-full border border-black/[0.06] bg-white/95 p-1.5 text-slate-500 shadow-md"
          aria-hidden
        />
      </div>
    </div>
  );
}
