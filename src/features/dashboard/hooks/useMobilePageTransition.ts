"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MOBILE_PAGE_TRANSITION_MS,
  computeMobileMountedPageIndices,
  computeMobilePageTransitionDirection,
  computeMobileScreenHostPanelPhase,
  type MobilePageTransitionDirection,
  type MobileScreenHostPanelPhase,
} from "@/features/dashboard/mobilePageTransition";

export type MobilePageTransitionState = {
  mountedIndices: Set<number>;
  outgoingIndex: number | null;
  direction: MobilePageTransitionDirection | null;
  isTransitioning: boolean;
  getPanelPhase: (panelIndex: number, overlayOpen: boolean) => MobileScreenHostPanelPhase;
};

export function useMobilePageTransition(activePageIndex: number): MobilePageTransitionState {
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<MobilePageTransitionDirection | null>(null);
  const prevActiveRef = useRef(activePageIndex);

  useEffect(() => {
    const previous = prevActiveRef.current;
    if (previous === activePageIndex) return;

    const nextDirection = computeMobilePageTransitionDirection(previous, activePageIndex);
    setDirection(nextDirection);
    setOutgoingIndex(previous);
    prevActiveRef.current = activePageIndex;

    const timeout = window.setTimeout(() => {
      setOutgoingIndex(null);
      setDirection(null);
    }, MOBILE_PAGE_TRANSITION_MS);

    return () => window.clearTimeout(timeout);
  }, [activePageIndex]);

  const mountedIndices = useMemo(
    () => computeMobileMountedPageIndices(activePageIndex, outgoingIndex),
    [activePageIndex, outgoingIndex]
  );

  const getPanelPhase = useMemo(
    () => (panelIndex: number, overlayOpen: boolean) =>
      computeMobileScreenHostPanelPhase(
        panelIndex,
        activePageIndex,
        outgoingIndex,
        direction,
        overlayOpen
      ),
    [activePageIndex, direction, outgoingIndex]
  );

  return {
    mountedIndices,
    outgoingIndex,
    direction,
    isTransitioning: outgoingIndex !== null,
    getPanelPhase,
  };
}
