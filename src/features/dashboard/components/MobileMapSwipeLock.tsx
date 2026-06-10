"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Lock, Unlock } from "lucide-react";

const LONG_PRESS_MS = 600;
const AUTO_LOCK_MS = 4000;
const SWIPE_THRESHOLD_PX = 44;
const AXIS_RATIO = 1.5;
const MOVE_CANCEL_PX = 10;

type Props = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

/**
 * Overlay transparent positionné au-dessus du panel carte.
 * - Swipe horizontal → navigation de panneau (locked)
 * - Appui long 600ms → déverrouille la carte pour interaction directe
 * - Auto-reverrouillage après 4s d'inactivité
 */
export default function MobileMapSwipeLock({ onSwipeLeft, onSwipeRight }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [ripplePos, setRipplePos] = useState<{ x: number; y: number } | null>(null);

  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLeftRef = useRef(onSwipeLeft);
  onLeftRef.current = onSwipeLeft;
  const onRightRef = useRef(onSwipeRight);
  onRightRef.current = onSwipeRight;

  const scheduleRelock = useCallback(() => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => setUnlocked(false), AUTO_LOCK_MS);
  }, []);

  const relock = useCallback(() => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    setUnlocked(false);
  }, []);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    let sx = 0;
    let sy = 0;
    let moved = false;
    let swipeFired = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      moved = false;
      swipeFired = false;

      const rect = el.getBoundingClientRect();
      const rx = sx - rect.left;
      const ry = sy - rect.top;

      pressTimerRef.current = setTimeout(() => {
        if (!moved) {
          setRipplePos({ x: rx, y: ry });
          setUnlocked(true);
          scheduleRelock();
          setTimeout(() => setRipplePos(null), 700);
        }
      }, LONG_PRESS_MS);

      e.stopPropagation();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - sx;
      const dy = e.touches[0].clientY - sy;

      if (!moved && Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
        moved = true;
        if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      }

      if (!swipeFired && Math.hypot(dx, dy) >= SWIPE_THRESHOLD_PX) {
        if (Math.abs(dx) >= Math.abs(dy) * AXIS_RATIO) {
          swipeFired = true;
          e.preventDefault();
          e.stopPropagation();
          if (dx < 0) onLeftRef.current();
          else onRightRef.current();
        }
      }
    };

    const onTouchEnd = () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, [scheduleRelock]);

  return (
    <>
      <div
        ref={overlayRef}
        className="mobile-map-swipe-lock"
        style={{ pointerEvents: unlocked ? "none" : "auto" }}
        aria-hidden
      />

      {ripplePos && (
        <div
          className="mobile-map-swipe-lock-ripple"
          style={{ left: ripplePos.x, top: ripplePos.y }}
          aria-hidden
        />
      )}

      {unlocked && (
        <button
          type="button"
          className="mobile-map-swipe-lock-badge"
          onClick={relock}
          aria-label="Reverrouiller la carte"
        >
          <Unlock className="w-3 h-3" />
        </button>
      )}

      {!unlocked && (
        <div className="mobile-map-swipe-lock-hint" aria-hidden>
          <Lock className="w-3 h-3" />
        </div>
      )}
    </>
  );
}
