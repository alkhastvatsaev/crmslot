"use client";

import { useEffect, useRef, type RefObject } from "react";

const SWIPE_THRESHOLD_PX = 44;
const AXIS_RATIO = 1.5;
/** Bloque seulement les champs où le drag horizontal sert à sélectionner du texte. */
const SWIPE_START_BLOCK_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

function shouldBlockSwipeStart(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(SWIPE_START_BLOCK_SELECTOR));
}

type GestureState = {
  sx: number;
  sy: number;
  fired: boolean;
  activePointerId: number | null;
  touchGestureActive: boolean;
};

function tryPanelSwipe(
  state: GestureState,
  dx: number,
  dy: number,
  disabled: boolean,
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  preventDefault?: (e: Event) => void,
  e?: Event
): void {
  if (disabled || state.fired) return;
  if (Math.hypot(dx, dy) < SWIPE_THRESHOLD_PX) return;
  if (Math.abs(dx) < Math.abs(dy) * AXIS_RATIO) return;
  state.fired = true;
  if (preventDefault && e) preventDefault(e);
  if (dx < 0) onSwipeLeft();
  else onSwipeRight();
}

/**
 * Swipe horizontal (touch + souris) sur `ref` → `onSwipeLeft` (vers la gauche)
 * ou `onSwipeRight` (vers la droite). Ignoré quand `disabled` est true.
 *
 * Touch + pointer : Android WebView et grilles de boutons (missions, équipe)
 * reposent sur touchmove ; la souris utilise pointer capture.
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

    const state: GestureState = {
      sx: 0,
      sy: 0,
      fired: false,
      activePointerId: null,
      touchGestureActive: false,
    };

    const reset = () => {
      state.activePointerId = null;
      state.fired = false;
      state.touchGestureActive = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (disabledRef.current || e.touches.length !== 1) return;
      if (shouldBlockSwipeStart(e.target)) return;
      state.touchGestureActive = true;
      state.sx = e.touches[0].clientX;
      state.sy = e.touches[0].clientY;
      state.fired = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (disabledRef.current || !state.touchGestureActive || e.touches.length !== 1) return;
      tryPanelSwipe(
        state,
        e.touches[0].clientX - state.sx,
        e.touches[0].clientY - state.sy,
        disabledRef.current,
        () => onLeftRef.current(),
        () => onRightRef.current(),
        (ev) => ev.preventDefault(),
        e
      );
    };

    const onTouchEnd = () => {
      state.touchGestureActive = false;
      state.fired = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (disabledRef.current) return;
      if (e.pointerType === "touch" && state.touchGestureActive) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (shouldBlockSwipeStart(e.target)) return;
      state.sx = e.clientX;
      state.sy = e.clientY;
      state.fired = false;
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
      if (disabledRef.current || state.fired || activePointerIdMismatch(state, e)) return;
      tryPanelSwipe(
        state,
        e.clientX - state.sx,
        e.clientY - state.sy,
        disabledRef.current,
        () => onLeftRef.current(),
        () => onRightRef.current(),
        (ev) => ev.preventDefault(),
        e
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      if (state.activePointerId !== e.pointerId) return;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      reset();
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (state.activePointerId !== e.pointerId) return;
      reset();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [ref]);
}

function activePointerIdMismatch(state: GestureState, e: PointerEvent): boolean {
  if (e.pointerType === "touch" && state.touchGestureActive) return true;
  return state.activePointerId !== e.pointerId;
}
