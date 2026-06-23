/**
 * API publique analytics — usage carrousel et hooks PostHog/GA4.
 */
export { useCarouselPageAnalytics } from "@/features/analytics/hooks/useCarouselPageAnalytics";
export {
  CAROUSEL_USAGE_STORAGE_KEY,
  emptyCarouselUsageSnapshot,
  mergeCarouselPageView,
  mergeCarouselDwell,
  carouselUsageRows,
  totalCarouselDwellMs,
  formatDwellShort,
  loadCarouselUsageSnapshot,
  saveCarouselUsageSnapshot,
} from "@/features/analytics/carouselUsageStore";
export type {
  CarouselPageUsage,
  CarouselUsageSnapshot,
} from "@/features/analytics/carouselUsageStore";
export { default as BiReportsPanel } from "@/features/analytics/components/BiReportsPanel";
export { default as CarouselUsagePanel } from "@/features/analytics/components/CarouselUsagePanel";
