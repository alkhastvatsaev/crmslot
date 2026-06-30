"use client";

import GlassPanel from "@/core/ui/GlassPanel";
import {
  MOBILE_HUB_LAYOUT_CLASS,
  mobileHubPanelGlassShellClass,
} from "@/core/ui/dashboardMobileLayout";

type Props = {
  testId?: string;
};

/** Skeleton affiché pendant le chargement d'un chunk hub (`next/dynamic`). */
export default function HubPageChunkLoading({ testId = "hub-page-chunk-loading" }: Props) {
  return (
    <div className={MOBILE_HUB_LAYOUT_CLASS} data-testid={testId} aria-busy="true">
      <GlassPanel
        as="section"
        shellClassName={mobileHubPanelGlassShellClass}
        innerClassName="flex min-h-0 flex-1 flex-col items-center justify-center p-6"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </GlassPanel>
    </div>
  );
}
