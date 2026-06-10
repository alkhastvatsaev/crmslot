"use client";

import { useEffect, useRef, type RefObject } from "react";

const SWIPE_THRESHOLD_PX = 44;
const AXIS_RATIO = 1.5;

/**
 * Détecte les swipes horizontaux sur `ref` et appelle `onSwipeLeft` (doigt →gauche)
 * ou `onSwipeRight` (doigt →droite). Ignoré quand `disabled` est true.
 */
export function usePanelSwipe(
  ref: RefObject<HTMLElement | null>,
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  disabled = false
): void {
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const onLeftRef = useRef(onSwipeLeft);
  onLeftRef.current = onSwipeLeft;
  const onRightRef = useRef(onSwipeRight);
  onRightRef.current = onSwipeRight;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let sx = 0;
    let sy = 0;
    let fired = false;

    const onTouchStart = (e: TouchEvent) => {
      if (disabledRef.current || e.touches.length !== 1) return;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      fired = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (disabledRef.current || fired || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - sx;
      const dy = e.touches[0].clientY - sy;
      if (Math.hypot(dx, dy) < SWIPE_THRESHOLD_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * AXIS_RATIO) return;
      fired = true;
      e.preventDefault();
      if (dx < 0) onLeftRef.current();
      else onRightRef.current();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [ref]);
}
