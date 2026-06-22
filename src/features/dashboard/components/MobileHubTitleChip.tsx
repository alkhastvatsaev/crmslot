"use client";

import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import {
  clampDashboardCarouselPageIndex,
  getDashboardCarouselPage,
} from "@/features/dashboard/dashboardCarouselRegistry";
import { useTranslation } from "@/core/i18n/I18nContext";

/** Titre du hub actif — header mobile (remplace le profil déplacé en footer). */
export default function MobileHubTitleChip() {
  const { t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const pageIndex = clampDashboardCarouselPageIndex(pager?.pageIndex ?? 0, pager?.pageCount ?? 1);
  const page = getDashboardCarouselPage(pageIndex);
  const label = page ? String(t(page.spotlightLabelKey)) : "";

  return (
    <div
      data-testid="mobile-hub-title-chip"
      className="mobile-header-chip flex h-full w-full items-center justify-center px-4"
    >
      <span className="truncate text-sm font-semibold uppercase tracking-wider text-slate-800">
        {label}
      </span>
    </div>
  );
}
