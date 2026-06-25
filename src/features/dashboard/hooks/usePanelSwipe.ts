"use client";

import { useEffect, useRef } from "react";

const SWIPE_THRESHOLD_PX = 40;
const AXIS_LOCK_PX = 10;
const AXIS_RATIO = 1.15;
/** Bloque seulement les champs où le drag horizontal sert à sélectionner du texte. */
const SWIPE_START_BLOCK_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

type AxisLock = "horizontal" | "vertical" | null;

type GestureState = {
  sx: number;
  sy: number;
  fired: boolean;
  axisLock: AxisLock;
  activePointerId: number | null;
  touchGestureActive: boolean;
};

function shouldBlockSwipeStart(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(SWIPE_START_BLOCK_SELECTOR));
}

function tryPanelSwipe(
  state: GestureState,
  dx: number,
  dy: number,
  disabled: boolean,
  onSwipeLeft: () => void,
  onSwipeRight: () => void
): void {
  if (disabled || state.fired) return;
  if (Math.hypot(dx, dy) < SWIPE_THRESHOLD_PX) return;
  if (Math.abs(dx) < Math.abs(dy) * AXIS_RATIO) return;
  state.fired = true;
  if (dx < 0) onSwipeLeft();
  else onSwipeRight();
}

function resolveAxisLock(dx: number, dy: number, current: AxisLock): AxisLock {
  if (current) return current;
  if (Math.hypot(dx, dy) < AXIS_LOCK_PX) return null;
  return Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";
}

/**
 * Swipe horizontal (touch + souris) sur `element` → `onSwipeLeft` / `onSwipeRight`.
 * Capture + verrou d'axe : Android / grilles scrollables ne bloquent plus le geste.
 */
export function usePanelSwipe(
  element: HTMLElement | null,
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
    const el = element;
    if (!el) return;

    const state: GestureState = {
      sx: 0,
      sy: 0,
      fired: false,
      axisLock: null,
      activePointerId: null,
      touchGestureActive: false,
    };

    const resetTouch = () => {
      state.touchGestureActive = false;
      state.axisLock = null;
      state.fired = false;
    };

    const resetPointer = () => {
      state.activePointerId = null;
      state.axisLock = null;
      state.fired = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (disabledRef.current || e.touches.length !== 1) return;
      if (shouldBlockSwipeStart(e.target)) return;
      state.touchGestureActive = true;
      state.axisLock = null;
      state.fired = false;
      state.sx = e.touches[0].clientX;
      state.sy = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (disabledRef.current || !state.touchGestureActive || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - state.sx;
      const dy = e.touches[0].clientY - state.sy;
      state.axisLock = resolveAxisLock(dx, dy, state.axisLock);
      if (state.axisLock === "vertical") return;
      if (state.axisLock === "horizontal") e.preventDefault();
      tryPanelSwipe(
        state,
        dx,
        dy,
        disabledRef.current,
        () => onLeftRef.current(),
        () => onRightRef.current()
      );
    };

    const onTouchEnd = () => {
      resetTouch();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (disabledRef.current) return;
      if (e.pointerType === "touch" && state.touchGestureActive) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (shouldBlockSwipeStart(e.target)) return;
      state.sx = e.clientX;
      state.sy = e.clientY;
      state.fired = false;
      state.axisLock = null;
      state.activePointerId = e.pointerId;
      if (e.pointerType === "mouse") {
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (disabledRef.current || state.fired) return;
      if (e.pointerType === "touch" && state.touchGestureActive) return;
      if (state.activePointerId !== e.pointerId) return;
      const dx = e.clientX - state.sx;
      const dy = e.clientY - state.sy;
      state.axisLock = resolveAxisLock(dx, dy, state.axisLock);
      if (state.axisLock === "vertical") return;
      if (state.axisLock === "horizontal") e.preventDefault();
      tryPanelSwipe(
        state,
        dx,
        dy,
        disabledRef.current,
        () => onLeftRef.current(),
        () => onRightRef.current()
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      if (state.activePointerId !== e.pointerId) return;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      resetPointer();
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (state.activePointerId !== e.pointerId) return;
      resetPointer();
    };

    const touchOpts = { capture: true } as const;
    el.addEventListener("touchstart", onTouchStart, { ...touchOpts, passive: true });
    el.addEventListener("touchmove", onTouchMove, { ...touchOpts, passive: false });
    el.addEventListener("touchend", onTouchEnd, touchOpts);
    el.addEventListener("touchcancel", onTouchEnd, touchOpts);
    el.addEventListener("pointerdown", onPointerDown, touchOpts);
    el.addEventListener("pointermove", onPointerMove, touchOpts);
    el.addEventListener("pointerup", onPointerUp, touchOpts);
    el.addEventListener("pointercancel", onPointerCancel, touchOpts);
    return () => {
      el.removeEventListener("touchstart", onTouchStart, touchOpts);
      el.removeEventListener("touchmove", onTouchMove, touchOpts);
      el.removeEventListener("touchend", onTouchEnd, touchOpts);
      el.removeEventListener("touchcancel", onTouchEnd, touchOpts);
      el.removeEventListener("pointerdown", onPointerDown, touchOpts);
      el.removeEventListener("pointermove", onPointerMove, touchOpts);
      el.removeEventListener("pointerup", onPointerUp, touchOpts);
      el.removeEventListener("pointercancel", onPointerCancel, touchOpts);
    };
  }, [element]);
}
