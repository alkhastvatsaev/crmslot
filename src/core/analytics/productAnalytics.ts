import { featureFlagsFromEnv } from "@/core/featureFlags";
import { ga4TrackEvent, initGa4Client } from "@/core/analytics/ga4";
import { captureEvent, initPosthogClient, posthogEnabled } from "@/core/analytics/posthog";
import {
  carouselPageViewProps,
  type CarouselPageViewProps,
} from "@/core/analytics/trackCarouselPageView";
import {
  loadCarouselUsageSnapshot,
  mergeCarouselDwell,
  mergeCarouselPageView,
  saveCarouselUsageSnapshot,
} from "@/features/analytics/carouselUsageStore";

export type ProductEventProps = Record<string, string | number | boolean>;

export function productAnalyticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    featureFlagsFromEnv().analyticsReports ||
    posthogEnabled() ||
    Boolean(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim())
  );
}

export function initProductAnalytics(): void {
  if (!productAnalyticsEnabled()) return;
  initPosthogClient();
  initGa4Client();
}

export function trackProductEvent(event: string, properties?: ProductEventProps): void {
  if (!productAnalyticsEnabled()) return;
  const props = properties ?? {};
  captureEvent(event, props);
  ga4TrackEvent(event, props);
}

function persistCarouselView(props: CarouselPageViewProps): void {
  const next = mergeCarouselPageView(loadCarouselUsageSnapshot(), props.page_id, props.page_title);
  saveCarouselUsageSnapshot(next);
}

function persistCarouselDwell(pageId: string, dwellMs: number): void {
  const next = mergeCarouselDwell(loadCarouselUsageSnapshot(), pageId, dwellMs);
  saveCarouselUsageSnapshot(next);
}

/** Entrée sur une page carrousel (vue + compteur local). */
export function trackCarouselPageView(
  pageIndex: number,
  pageCount: number,
  fromPageIndex?: number
): void {
  const props = carouselPageViewProps(pageIndex, pageCount);
  trackProductEvent("carousel_page_view", {
    ...props,
    from_page_index: fromPageIndex ?? -1,
  });
  persistCarouselView(props);
}

/** Sortie d'une page — temps passé + navigation vers la suivante. */
export function trackCarouselPageLeave(
  pageIndex: number,
  dwellMs: number,
  toPageIndex: number,
  pageCount: number
): void {
  const props = carouselPageViewProps(pageIndex, pageCount);
  trackProductEvent("carousel_page_leave", {
    ...props,
    dwell_ms: Math.max(0, Math.round(dwellMs)),
    to_page_index: toPageIndex,
  });
  if (dwellMs > 0) persistCarouselDwell(props.page_id, dwellMs);
}
