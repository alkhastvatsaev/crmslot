"use client";

import { useDashboardPager } from "@/features/dashboard/dashboardPagerContext";

type Props = { pages: React.ReactNode[] };

/**
 * Affiche une seule page hub à la fois (comme UITabBarController).
 * Pas de scroll vertical — changement via MobileTabBar / Spotlight.
 */
export default function MobileScreenHost({ pages }: Props) {
  const { pageIndex } = useDashboardPager();
  const active = pages[pageIndex] ?? null;

  return (
    <main className="mobile-screen-host" data-testid="mobile-screen-host" aria-live="polite">
      <div className="mobile-screen-host-panel" data-testid={`mobile-page-${pageIndex}`}>
        {active}
      </div>
    </main>
  );
}
