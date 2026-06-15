import { DASHBOARD_CAROUSEL_PAGES } from "@/features/dashboard/dashboardCarouselRegistry";

export const CAROUSEL_USAGE_STORAGE_KEY = "crmslot_carousel_usage_v1";

export type CarouselPageUsage = {
  pageId: string;
  pageTitle: string;
  views: number;
  dwellMs: number;
  lastViewedAt: string;
};

export type CarouselUsageSnapshot = {
  updatedAt: string;
  pages: Record<string, Omit<CarouselPageUsage, "pageId">>;
};

export function emptyCarouselUsageSnapshot(now = new Date()): CarouselUsageSnapshot {
  return { updatedAt: now.toISOString(), pages: {} };
}

export function mergeCarouselPageView(
  snapshot: CarouselUsageSnapshot,
  pageId: string,
  pageTitle: string,
  now = new Date()
): CarouselUsageSnapshot {
  const prev = snapshot.pages[pageId];
  return {
    updatedAt: now.toISOString(),
    pages: {
      ...snapshot.pages,
      [pageId]: {
        pageTitle,
        views: (prev?.views ?? 0) + 1,
        dwellMs: prev?.dwellMs ?? 0,
        lastViewedAt: now.toISOString(),
      },
    },
  };
}

export function mergeCarouselDwell(
  snapshot: CarouselUsageSnapshot,
  pageId: string,
  dwellMs: number,
  now = new Date()
): CarouselUsageSnapshot {
  if (dwellMs <= 0) return snapshot;
  const prev = snapshot.pages[pageId];
  return {
    updatedAt: now.toISOString(),
    pages: {
      ...snapshot.pages,
      [pageId]: {
        pageTitle: prev?.pageTitle ?? pageId,
        views: prev?.views ?? 0,
        dwellMs: (prev?.dwellMs ?? 0) + Math.round(dwellMs),
        lastViewedAt: prev?.lastViewedAt ?? now.toISOString(),
      },
    },
  };
}

/** Lignes triées par temps passé (plus utile que le seul compteur de vues). */
export function carouselUsageRows(snapshot: CarouselUsageSnapshot): CarouselPageUsage[] {
  const knownIds = DASHBOARD_CAROUSEL_PAGES.map((p) =>
    p.spotlightLabelKey.replace("spotlight.nav_", "")
  );

  const rows: CarouselPageUsage[] = knownIds.map((pageId) => {
    const def = DASHBOARD_CAROUSEL_PAGES.find(
      (p) => p.spotlightLabelKey.replace("spotlight.nav_", "") === pageId
    );
    const stored = snapshot.pages[pageId];
    return {
      pageId,
      pageTitle: stored?.pageTitle ?? def?.guideTitle ?? pageId,
      views: stored?.views ?? 0,
      dwellMs: stored?.dwellMs ?? 0,
      lastViewedAt: stored?.lastViewedAt ?? "",
    };
  });

  return rows.sort((a, b) => b.dwellMs - a.dwellMs || b.views - a.views);
}

export function totalCarouselDwellMs(rows: CarouselPageUsage[]): number {
  return rows.reduce((sum, r) => sum + r.dwellMs, 0);
}

export function formatDwellShort(ms: number): string {
  if (ms < 1000) return "<1s";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem > 0 ? `${min}m ${rem}s` : `${min}m`;
}

export function loadCarouselUsageSnapshot(): CarouselUsageSnapshot {
  if (typeof window === "undefined") return emptyCarouselUsageSnapshot();
  try {
    const raw = window.localStorage.getItem(CAROUSEL_USAGE_STORAGE_KEY);
    if (!raw) return emptyCarouselUsageSnapshot();
    const parsed = JSON.parse(raw) as CarouselUsageSnapshot;
    if (!parsed?.pages || typeof parsed.pages !== "object") {
      return emptyCarouselUsageSnapshot();
    }
    return parsed;
  } catch {
    return emptyCarouselUsageSnapshot();
  }
}

export function saveCarouselUsageSnapshot(snapshot: CarouselUsageSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CAROUSEL_USAGE_STORAGE_KEY, JSON.stringify(snapshot));
    window.dispatchEvent(new CustomEvent("crmslot-carousel-usage-updated"));
  } catch {
    // Quota / mode privé — analytics ne doit pas casser l'UI.
  }
}
