"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { usePanelSwipe } from "@/features/dashboard/hooks/usePanelSwipe";
import {
  MOBILE_HUB_PANEL_ANIMATED_CLASS,
  MOBILE_HUB_RAIL_LAYER_CLASS,
  mobileHubRailLayerSideClass,
} from "@/features/dashboard/mobileHubRailMotion";
import { cn } from "@/lib/utils";
import { MOBILE_HEADER_RAIL_HOST_CLASS } from "@/core/ui/dashboardMobileLayout";

type HeaderRail = "left" | "center";

const HEADER_RAILS: readonly HeaderRail[] = ["left", "center"];

type Props = {
  /** Calendrier / horloge (desktop haut gauche). */
  left: ReactNode;
  /** Profil (desktop haut droite). */
  center: ReactNode;
  leftTestId?: string;
  centerTestId?: string;
  rootTestId?: string;
  /** Désactive le swipe (ex. sélecteur de pages ouvert). */
  swipeDisabled?: boolean;
};

/**
 * Bandeau header mobile — 2 rails avec la même transition que `MobileHubLayout`.
 * Swipe en boucle : profil ↔ calendrier (gauche ou droite).
 */
export default function MobileHeaderRailLayout({
  left,
  center,
  leftTestId,
  centerTestId,
  rootTestId,
  swipeDisabled = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [rail, setRail] = useState<HeaderRail>("left");

  const panels: Record<HeaderRail, ReactNode> = { left, center };
  const testIds: Record<HeaderRail, string | undefined> = {
    left: leftTestId,
    center: centerTestId,
  };

  const pickRail = useCallback((next: HeaderRail) => {
    setRail(next);
  }, []);

  const navigateLeft = useCallback(() => {
    const idx = HEADER_RAILS.indexOf(rail);
    pickRail(HEADER_RAILS[(idx + 1) % HEADER_RAILS.length]);
  }, [rail, pickRail]);

  const navigateRight = useCallback(() => {
    const idx = HEADER_RAILS.indexOf(rail);
    pickRail(HEADER_RAILS[(idx - 1 + HEADER_RAILS.length) % HEADER_RAILS.length]);
  }, [rail, pickRail]);

  // Swipe doigt gauche / droit → rail suivant en boucle.
  usePanelSwipe(rootRef, navigateRight, navigateLeft, swipeDisabled);

  return (
    <div
      ref={rootRef}
      className={cn(MOBILE_HEADER_RAIL_HOST_CLASS, MOBILE_HUB_PANEL_ANIMATED_CLASS)}
      data-testid={rootTestId}
    >
      {HEADER_RAILS.map((railKey) => {
        const active = rail === railKey;
        return (
          <div
            key={railKey}
            aria-hidden={!active}
            data-testid={testIds[railKey]}
            data-mobile-header-rail={railKey}
            data-mobile-header-rail-active={active ? "true" : "false"}
            className={cn(
              MOBILE_HUB_RAIL_LAYER_CLASS,
              "mobile-header-rail-layer",
              mobileHubRailLayerSideClass(railKey, rail, HEADER_RAILS)
            )}
          >
            {panels[railKey]}
          </div>
        );
      })}
    </div>
  );
}
