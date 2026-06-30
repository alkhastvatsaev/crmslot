"use client";

import { useLayoutEffect, useState } from "react";
import type { MobileScreenHostPanelPhase } from "@/features/dashboard/mobilePageTransition";

function isEnterPhase(phase: MobileScreenHostPanelPhase): boolean {
  return phase === "enter-next" || phase === "enter-prev";
}

/**
 * Déclenche la transition d'entrée après le premier paint (évite le flash opacity).
 */
export function useMobilePanelMotionReady(phase: MobileScreenHostPanelPhase): boolean {
  const [motionRun, setMotionRun] = useState(() => !isEnterPhase(phase));

  useLayoutEffect(() => {
    if (!isEnterPhase(phase)) {
      setMotionRun(true);
      return;
    }

    setMotionRun(false);
    const frame = requestAnimationFrame(() => {
      setMotionRun(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  return motionRun;
}
