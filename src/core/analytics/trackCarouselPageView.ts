import {
  DASHBOARD_CAROUSEL_PAGES,
  type DashboardCarouselPageDef,
} from "@/features/dashboard/dashboardCarouselRegistry";

export type CarouselPageViewProps = {
  page_index: number;
  page_count: number;
  page_id: string;
  page_title: string;
  profile_name: string;
};

export function carouselPageDefForIndex(pageIndex: number): DashboardCarouselPageDef | undefined {
  return DASHBOARD_CAROUSEL_PAGES.find((p) => p.slotIndex === pageIndex);
}

/** Propriétés PostHog pour une vue de page carrousel (index 0-based). */
export function carouselPageViewProps(pageIndex: number, pageCount: number): CarouselPageViewProps {
  const page = carouselPageDefForIndex(pageIndex);
  return {
    page_index: pageIndex,
    page_count: pageCount,
    page_id: page?.spotlightLabelKey.replace("spotlight.nav_", "") ?? `slot_${pageIndex}`,
    page_title: page?.guideTitle ?? `Page ${pageIndex + 1}`,
    profile_name: page?.profileName ?? "",
  };
}
