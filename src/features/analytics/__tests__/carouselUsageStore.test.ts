import {
  carouselUsageRows,
  emptyCarouselUsageSnapshot,
  formatDwellShort,
  mergeCarouselDwell,
  mergeCarouselPageView,
  totalCarouselDwellMs,
} from "../carouselUsageStore";
import { DASHBOARD_CAROUSEL_PAGES } from "@/features/dashboard/dashboardCarouselRegistry";

describe("carouselUsageStore", () => {
  it("incrémente les vues par page", () => {
    let snap = emptyCarouselUsageSnapshot();
    snap = mergeCarouselPageView(snap, "map", "Carte");
    snap = mergeCarouselPageView(snap, "map", "Carte");
    expect(snap.pages.map?.views).toBe(2);
  });

  it("agrège le temps passé", () => {
    let snap = mergeCarouselPageView(emptyCarouselUsageSnapshot(), "billing_hub", "Facturation");
    snap = mergeCarouselDwell(snap, "billing_hub", 5000);
    snap = mergeCarouselDwell(snap, "billing_hub", 3000);
    expect(snap.pages.billing_hub?.dwellMs).toBe(8000);
  });

  it("retourne une ligne par page carrousel, triées par dwell", () => {
    let snap = emptyCarouselUsageSnapshot();
    snap = mergeCarouselDwell(snap, "map", 1000);
    snap = mergeCarouselDwell(snap, "billing_hub", 9000);
    const rows = carouselUsageRows(snap);
    expect(rows).toHaveLength(DASHBOARD_CAROUSEL_PAGES.length);
    expect(rows[0]?.pageId).toBe("billing_hub");
    expect(totalCarouselDwellMs(rows)).toBe(10000);
  });

  it("formate la durée", () => {
    expect(formatDwellShort(500)).toBe("<1s");
    expect(formatDwellShort(45_000)).toBe("45s");
    expect(formatDwellShort(125_000)).toBe("2m 5s");
  });
});
