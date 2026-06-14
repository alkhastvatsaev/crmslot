import {
  mergeCarouselDwell,
  mergeCarouselPageView,
  emptyCarouselUsageSnapshot,
} from "@/features/analytics/carouselUsageStore";

jest.mock("@/core/featureFlags", () => ({
  featureFlagsFromEnv: () => ({ analyticsReports: true }),
}));

describe("productAnalytics store integration", () => {
  it("merge view + dwell reflète un parcours carrousel", () => {
    let snap = emptyCarouselUsageSnapshot();
    snap = mergeCarouselPageView(snap, "technician", "Technicien");
    snap = mergeCarouselDwell(snap, "technician", 45000);
    snap = mergeCarouselPageView(snap, "billing_hub", "Facturation");
    expect(snap.pages.technician?.views).toBe(1);
    expect(snap.pages.technician?.dwellMs).toBe(45000);
    expect(snap.pages.billing_hub?.views).toBe(1);
  });
});
