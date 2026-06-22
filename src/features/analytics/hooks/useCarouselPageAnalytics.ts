"use client";

import { useEffect, useRef } from "react";
import { isIosPhonePowerSave } from "@/core/perf/iosPhonePowerSave";
import { trackCarouselPageLeave, trackCarouselPageView } from "@/core/analytics/productAnalytics";

/**
 * Mesure vues + temps passé par page carrousel.
 * Envoie PostHog/GA4 + agrège localement (dashboard /reports).
 */
export function useCarouselPageAnalytics(pageIndex: number, pageCount: number): void {
  const enteredAtRef = useRef(0);
  const activeIndexRef = useRef(pageIndex);
  const isFirstRef = useRef(true);

  useEffect(() => {
    if (typeof navigator !== "undefined" && isIosPhonePowerSave()) return;
    if (isFirstRef.current) {
      isFirstRef.current = false;
      activeIndexRef.current = pageIndex;
      enteredAtRef.current = Date.now();
      trackCarouselPageView(pageIndex, pageCount);
      return;
    }

    if (activeIndexRef.current === pageIndex) return;

    const fromIndex = activeIndexRef.current;
    const dwellMs = Date.now() - enteredAtRef.current;
    trackCarouselPageLeave(fromIndex, dwellMs, pageIndex, pageCount);
    trackCarouselPageView(pageIndex, pageCount, fromIndex);

    activeIndexRef.current = pageIndex;
    enteredAtRef.current = Date.now();
  }, [pageIndex, pageCount]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && isIosPhonePowerSave()) return;
    return () => {
      const dwellMs = Date.now() - enteredAtRef.current;
      trackCarouselPageLeave(activeIndexRef.current, dwellMs, -1, pageCount);
    };
  }, [pageCount]);
}
