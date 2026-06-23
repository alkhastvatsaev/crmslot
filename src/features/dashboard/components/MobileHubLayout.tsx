"use client";

import { useRef, useState, useCallback, useEffect, useId, useMemo, type ReactNode } from "react";
import { MOBILE_HUB_RAILS, type MobileHubRail } from "@/features/dashboard/dashboardMobileNav";
import { usePanelSwipe } from "@/features/dashboard/hooks/usePanelSwipe";
import { useMobileHubPanelVisible } from "@/features/dashboard/hooks/useMobileHubPanelVisible";
import { useMobileHubRailRegistration } from "@/features/dashboard/MobileHubRailContext";
import { useMobileDockOnboardingOptional } from "@/features/dashboard/MobileDockOnboardingContext";
import {
  MOBILE_HUB_PANEL_ANIMATED_CLASS,
  MOBILE_HUB_RAIL_LAYER_CLASS,
  mobileHubRailLayerSideClass,
  stepMobileHubRail,
} from "@/features/dashboard/mobileHubRailMotion";
import { cn } from "@/lib/utils";
import GlassPanel from "@/core/ui/GlassPanel";
import {
  MOBILE_HUB_LAYOUT_CLASS,
  MOBILE_HUB_PANEL_INNER_CLASS,
  MOBILE_HUB_PANEL_INNER_PADDED_CLASS,
  MOBILE_HUB_PANEL_INNER_SCROLL_CLASS,
  mobileHubPanelGlassShellClass,
} from "@/core/ui/dashboardMobileLayout";

type Props = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  leftLabel?: string;
  centerLabel?: string;
  rightLabel?: string;
  rootTestId?: string;
  leftTestId?: string;
  centerTestId?: string;
  rightTestId?: string;
  panelPadding?: boolean;
  sideScroll?: boolean;
  onRailChange?: (rail: MobileHubRail) => void;
  /** Mode contrôlé : force le rail actif depuis l'extérieur. */
  activeRail?: MobileHubRail;
  /** Rail affiché au premier rendu mobile (défaut : centre). */
  mobileInitialRail?: MobileHubRail;
  /** Bloque le swipe horizontal (ex. signature client sur le panneau central). */
  swipeDisabled?: boolean;
};

const RAIL_PANEL: Record<MobileHubRail, keyof Pick<Props, "left" | "center" | "right">> = {
  left: "left",
  center: "center",
  right: "right",
};

const RAIL_TEST_ID: Record<
  MobileHubRail,
  keyof Pick<Props, "leftTestId" | "centerTestId" | "rightTestId">
> = {
  left: "leftTestId",
  center: "centerTestId",
  right: "rightTestId",
};

export default function MobileHubLayout({
  left,
  center,
  right,
  leftLabel = "Panneau gauche",
  centerLabel = "Panneau principal",
  rightLabel = "Panneau droit",
  rootTestId,
  leftTestId,
  centerTestId,
  rightTestId,
  panelPadding = true,
  sideScroll = true,
  onRailChange,
  activeRail,
  mobileInitialRail = "center",
  swipeDisabled = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const registrationId = useId();
  const setRegistration = useMobileHubRailRegistration();
  const panelVisible = useMobileHubPanelVisible(rootRef);
  const dockOnboarding = useMobileDockOnboardingOptional();
  const [rail, setRail] = useState<MobileHubRail>(mobileInitialRail);

  const panels = { left, center, right };
  const testIds: Record<MobileHubRail, string | undefined> = {
    left: leftTestId,
    center: centerTestId,
    right: rightTestId,
  };
  const labels: Record<MobileHubRail, string> = {
    left: leftLabel,
    center: centerLabel,
    right: rightLabel,
  };

  const availableRails = useMemo(
    () => MOBILE_HUB_RAILS.filter((r) => !!panels[RAIL_PANEL[r]]),
    [panels.left, panels.center, panels.right]
  );

  const pickRail = useCallback(
    (next: MobileHubRail) => {
      setRail(next);
      onRailChange?.(next);
    },
    [onRailChange]
  );

  const navigateLeft = useCallback(() => {
    if (availableRails.length <= 1) return;
    pickRail(stepMobileHubRail(availableRails, rail, "next"));
  }, [availableRails, rail, pickRail]);

  const navigateRight = useCallback(() => {
    if (availableRails.length <= 1) return;
    pickRail(stepMobileHubRail(availableRails, rail, "prev"));
  }, [availableRails, rail, pickRail]);

  useEffect(() => {
    if (activeRail && activeRail !== rail) pickRail(activeRail);
    // pickRail change uniquement si onRailChange change — stable en pratique
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRail]);

  usePanelSwipe(rootRef, navigateLeft, navigateRight, swipeDisabled);

  const innerClassFor = useCallback(
    (railKey: MobileHubRail) => {
      if (panelPadding && sideScroll && railKey !== "center") {
        return `${MOBILE_HUB_PANEL_INNER_SCROLL_CLASS} mobile-hub-panel-inner--padded`;
      }
      if (panelPadding) return MOBILE_HUB_PANEL_INNER_PADDED_CLASS;
      if (sideScroll && railKey !== "center") return MOBILE_HUB_PANEL_INNER_SCROLL_CLASS;
      return MOBILE_HUB_PANEL_INNER_CLASS;
    },
    [panelPadding, sideScroll]
  );

  useEffect(() => {
    if (availableRails.length <= 1) {
      setRegistration(registrationId, null);
      return;
    }
    setRegistration(registrationId, {
      rails: availableRails,
      activeRail: rail,
      visible: panelVisible,
      requestRail: pickRail,
    });
    return () => setRegistration(registrationId, null);
  }, [availableRails, panelVisible, pickRail, rail, registrationId, setRegistration]);

  const swipeHintSide =
    rail === "center" && availableRails.length > 1
      ? dockOnboarding?.swipeRightHintActive
        ? "right"
        : dockOnboarding?.swipeLeftHintActive
          ? "left"
          : undefined
      : undefined;

  const handleSwipeHintClick = useCallback(() => {
    if (!dockOnboarding) return;
    if (dockOnboarding.swipeRightHintActive) {
      dockOnboarding.dismissSwipeRightHint();
      return;
    }
    if (dockOnboarding.swipeLeftHintActive) {
      dockOnboarding.dismissSwipeLeftHint();
    }
  }, [dockOnboarding]);

  return (
    <div
      ref={rootRef}
      className={MOBILE_HUB_LAYOUT_CLASS}
      data-testid={rootTestId}
      data-mobile-hub-swipe-hint={swipeHintSide}
      onClick={swipeHintSide ? handleSwipeHintClick : undefined}
    >
      <GlassPanel
        as="section"
        aria-label={labels[rail]}
        shellClassName={cn(
          mobileHubPanelGlassShellClass,
          availableRails.length > 1 && MOBILE_HUB_PANEL_ANIMATED_CLASS
        )}
        innerClassName="relative min-h-0 flex-1 flex-col overflow-hidden"
        style={{ position: "relative" }}
      >
        {availableRails.map((railKey) => {
          const active = rail === railKey;
          return (
            <div
              key={railKey}
              aria-label={labels[railKey]}
              aria-hidden={!active}
              data-testid={testIds[railKey]}
              data-mobile-hub-rail={railKey}
              data-mobile-hub-rail-active={active ? "true" : "false"}
              className={cn(
                innerClassFor(railKey),
                MOBILE_HUB_RAIL_LAYER_CLASS,
                mobileHubRailLayerSideClass(railKey, rail, availableRails)
              )}
            >
              {panels[RAIL_PANEL[railKey]]}
            </div>
          );
        })}
      </GlassPanel>
    </div>
  );
}
