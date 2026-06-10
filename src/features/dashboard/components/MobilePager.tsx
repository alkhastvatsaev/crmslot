"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useDashboardPager } from "@/features/dashboard/dashboardPagerContext";

type Props = { pages: ReactNode[] };

/**
 * Carousel vertical snap pour mobile. Swipe haut/bas = changement de page.
 * Synchronisé bidirectionnellement avec DashboardPagerContext :
 *   - setPageIndex depuis une autre page → scrollIntoView
 *   - swipe manuel → setPageIndex
 */
export default function MobilePager({ pages }: Props) {
  const { pageIndex, setPageIndex } = useDashboardPager();
  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammatic = useRef(false);
  const lastIndex = useRef(pageIndex);

  // Navigation programmatique → scroll
  useEffect(() => {
    if (pageIndex === lastIndex.current) return;
    const el = containerRef.current;
    if (!el) return;
    isProgrammatic.current = true;
    lastIndex.current = pageIndex;
    el.scrollTo({ top: pageIndex * el.clientHeight, behavior: "smooth" });
    const t = setTimeout(() => {
      isProgrammatic.current = false;
    }, 600);
    return () => clearTimeout(t);
  }, [pageIndex]);

  const handleScroll = useCallback(() => {
    if (isProgrammatic.current) return;
    const el = containerRef.current;
    if (!el) return;
    const newIndex = Math.round(el.scrollTop / el.clientHeight);
    if (newIndex !== lastIndex.current) {
      lastIndex.current = newIndex;
      setPageIndex(newIndex);
    }
  }, [setPageIndex]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 overflow-y-scroll snap-y snap-mandatory touch-pan-y"
      style={{
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "contain",
      }}
      data-testid="mobile-pager"
      data-mobile-pager
    >
      {pages.map((page, i) => (
        <div
          key={i}
          className="w-full h-full shrink-0 snap-start overflow-hidden"
          aria-hidden={i !== pageIndex}
          data-testid={`mobile-page-${i}`}
        >
          {page}
        </div>
      ))}
    </div>
  );
}
