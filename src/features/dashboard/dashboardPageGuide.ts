import {
  DASHBOARD_CAROUSEL_PAGES,
  getDashboardCarouselPage,
} from "@/features/dashboard/dashboardCarouselRegistry";

/** Libellés pour les pages du carrousel (index = pageIndex pager). */
export type DashboardPageMeta = {
  title: string;
  hint: string;
};

/** Dérivé du registre carrousel — garder en sync avec `dashboardCarouselRegistry.ts`. */
export const DASHBOARD_PAGE_GUIDE: DashboardPageMeta[] = DASHBOARD_CAROUSEL_PAGES.map((page) => ({
  title: page.guideTitle,
  hint: page.guideHint,
}));

export function getDashboardPageGuide(pageIndex: number): DashboardPageMeta | null {
  const page = getDashboardCarouselPage(pageIndex);
  if (!page) return null;
  return DASHBOARD_PAGE_GUIDE[pageIndex] ?? null;
}
