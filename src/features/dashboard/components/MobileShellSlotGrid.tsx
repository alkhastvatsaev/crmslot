"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MOBILE_SHELL_SLOT_GRID_CLASS } from "@/core/ui/dashboardMobileLayout";

type Props = {
  children: ReactNode;
  chromeClassName: string;
  rootClassName?: string;
  "data-testid"?: string;
};

/**
 * Grille 3 colonnes partagée (gouttière | contenu | gouttière).
 * Utilisée par le bandeau profil et le dock Galaxy — une seule source de dimensions.
 */
export default function MobileShellSlotGrid({
  children,
  chromeClassName,
  rootClassName,
  "data-testid": testId,
}: Props) {
  return (
    <div className={cn(MOBILE_SHELL_SLOT_GRID_CLASS, rootClassName)} data-testid={testId}>
      <div aria-hidden />
      <div className={chromeClassName}>{children}</div>
      <div aria-hidden />
    </div>
  );
}
