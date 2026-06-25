"use client";

import { useState, useCallback, useEffect, useId, useMemo, type ReactNode } from "react";
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
  const [rootNode, setRootNode] = useState<HTMLDivElement | null>(null);
  const setRootRef = useCallback((node: HTMLDivElement | null) => {
    setRootNode(node);
  }, []);
  const registrationId = useId();
  const setRegistration = useMobileHubRailRegistration();
  const panelVisible = useMobileHubPanelVisible(rootNode);
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
    const next = stepMobileHubRail(availableRails, rail, "next");
    if (dockOnboarding?.swipeRightHintActive && rail === "center" && next === "right") {
      dockOnboarding.dismissSwipeRightHint();
    }
    pickRail(next);
  }, [availableRails, rail, pickRail, dockOnboarding]);

  const navigateRight = useCallback(() => {
    if (availableRails.length <= 1) return;
    const next = stepMobileHubRail(availableRails, rail, "prev");
    if (dockOnboarding?.swipeLeftHintActive && rail === "right" && next !== "right") {
      dockOnboarding.dismissSwipeLeftHint();
    }
    pickRail(next);
  }, [availableRails, rail, pickRail, dockOnboarding]);

  useEffect(() => {
    if (activeRail && activeRail !== rail) pickRail(activeRail);
    // pickRail change uniquement si onRailChange change — stable en pratique
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRail]);

  usePanelSwipe(rootNode, navigateLeft, navigateRight, swipeDisabled);

  const innerClassFor = useCallback(
    (railKey: MobileHubRail) => {
      if (sideScroll && railKey !== "center") {
        return `${MOBILE_HUB_PANEL_INNER_SCROLL_CLASS} mobile-hub-panel-inner--padded`;
      }
      if (panelPadding) return MOBILE_HUB_PANEL_INNER_PADDED_CLASS;
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

  const swipeHintSide = (() => {
    if (availableRails.length <= 1) return undefined;
    if (
      dockOnboarding?.swipeRightHintActive &&
      rail === "center" &&
      availableRails.includes("right")
    ) {
      return "right";
    }
    if (dockOnboarding?.swipeLeftHintActive && rail === "right") {
      return "left";
    }
    return undefined;
  })();

  return (
    <div
      ref={setRootRef}
      className={MOBILE_HUB_LAYOUT_CLASS}
      data-testid={rootTestId}
      data-mobile-hub-swipe-hint={swipeHintSide}
    >
      {availableRails.length > 1 ? (
        <div
          className="mobile-rail-segment shrink-0"
          role="tablist"
          aria-label={centerLabel}
          data-testid="mobile-hub-rail-tabs"
        >
          {availableRails.map((railKey) => (
            <button
              key={railKey}
              type="button"
              role="tab"
              aria-selected={rail === railKey}
              data-testid={`mobile-hub-rail-tab-${railKey}`}
              className={cn(
                "mobile-rail-segment-btn",
                rail === railKey && "mobile-rail-segment-btn--active"
              )}
              onClick={() => pickRail(railKey)}
            >
              {labels[railKey]}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mobile-hub-panel-stack relative flex min-h-0 min-w-0 flex-1 flex-col">
        {swipeHintSide ? (
          <div
            className={cn("mobile-hub-swipe-hint", `mobile-hub-swipe-hint--${swipeHintSide}`)}
            data-testid={`mobile-hub-swipe-hint-${swipeHintSide}`}
            aria-hidden
          />
        ) : null}
        <GlassPanel
          as="section"
          aria-label={labels[rail]}
          className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col"
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
    </div>
  );
}
