"use client";

import { useEffect, useRef, type RefObject } from "react";
import { bindMobilePageSwipeGesture } from "@/features/dashboard/mobileNestedScrollGesture";

/** Distance minimale (px) pour changer de hub. */
export const MOBILE_PAGE_SWIPE_THRESHOLD_PX = 52;

/**
 * Swipe vertical sur le panneau central mobile :
 * - doigt vers le haut → page suivante
 * - doigt vers le bas → page précédente
 */
export function useMobilePageSwipe(
  ref: RefObject<HTMLElement | null>,
  onSwipeUp: () => void,
  onSwipeDown: () => void,
  disabled = false
): void {
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const onUpRef = useRef(onSwipeUp);
  onUpRef.current = onSwipeUp;
  const onDownRef = useRef(onSwipeDown);
  onDownRef.current = onSwipeDown;

  useEffect(() => {
    const boundary = ref.current;
    if (!boundary) return;

    return bindMobilePageSwipeGesture(boundary, {
      swipeThresholdPx: MOBILE_PAGE_SWIPE_THRESHOLD_PX,
      isDisabled: () => disabledRef.current,
      onSwipeUp: () => onUpRef.current(),
      onSwipeDown: () => onDownRef.current(),
    });
  }, [ref]);
}
