"use client";

import { useEffect, useRef, type RefObject } from "react";

const SWIPE_THRESHOLD_PX = 44;
const AXIS_RATIO = 1.5;
const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, label, [role="button"], [contenteditable="true"], [data-no-panel-swipe]';

function isSwipeGestureBlocked(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(INTERACTIVE_SELECTOR));
}

/**
 * Swipe horizontal (touch + souris) sur `ref` → `onSwipeLeft` (vers la gauche)
 * ou `onSwipeRight` (vers la droite). Ignoré quand `disabled` est true.
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
    let activePointerId: number | null = null;

    const resetPointer = () => {
      activePointerId = null;
      fired = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (disabledRef.current) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (isSwipeGestureBlocked(e.target)) return;
      sx = e.clientX;
      sy = e.clientY;
      fired = false;
      activePointerId = e.pointerId;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (disabledRef.current || fired || activePointerId !== e.pointerId) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.hypot(dx, dy) < SWIPE_THRESHOLD_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * AXIS_RATIO) return;
      fired = true;
      e.preventDefault();
      if (dx < 0) onLeftRef.current();
      else onRightRef.current();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (activePointerId !== e.pointerId) return;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      resetPointer();
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (activePointerId !== e.pointerId) return;
      resetPointer();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [ref]);
}
