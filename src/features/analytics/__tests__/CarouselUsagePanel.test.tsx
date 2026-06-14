import { render, screen } from "@/test-utils/render";
import CarouselUsagePanel from "../components/CarouselUsagePanel";
import { CAROUSEL_USAGE_STORAGE_KEY } from "../carouselUsageStore";

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: (key: string) => key === "analyticsReports",
}));

describe("CarouselUsagePanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("affiche l'état vide sans données", () => {
    render(<CarouselUsagePanel />);
    expect(screen.getByTestId("carousel-usage-panel")).toBeInTheDocument();
    expect(screen.getByTestId("carousel-usage-empty")).toBeInTheDocument();
  });

  it("affiche les barres quand des stats existent", () => {
    window.localStorage.setItem(
      CAROUSEL_USAGE_STORAGE_KEY,
      JSON.stringify({
        updatedAt: new Date().toISOString(),
        pages: {
          map: { pageTitle: "Carte", views: 3, dwellMs: 12000, lastViewedAt: "2026-06-10" },
        },
      })
    );
    render(<CarouselUsagePanel />);
    expect(screen.getByTestId("carousel-usage-row-map")).toBeInTheDocument();
    expect(screen.getByTestId("carousel-usage-bar-map")).toBeInTheDocument();
  });
});
