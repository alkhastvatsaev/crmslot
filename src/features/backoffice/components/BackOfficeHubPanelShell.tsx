"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import HubPanelHeader from "@/core/ui/hub/HubPanelHeader";

type Props = {
  title?: string;
  testId: string;
  children?: ReactNode;
  className?: string;
  badge?: string;
};

/** En-tête + zone scrollable dans un rail GlassPanel du hub back-office. */
export default function BackOfficeHubPanelShell({
  title,
  testId,
  children,
  className,
  badge,
}: Props) {
  return (
    <div
      data-testid={testId}
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <HubPanelHeader title={title} badge={badge} variant="eyebrow" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
