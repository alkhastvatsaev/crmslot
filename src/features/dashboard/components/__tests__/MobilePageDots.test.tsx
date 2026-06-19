import { fireEvent, render, screen } from "@/test-utils/render";
import MobilePageDots from "@/features/dashboard/components/MobilePageDots";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";

describe("MobilePageDots", () => {
  it("affiche un dot actif par pageIndex", () => {
    render(
      <DashboardPagerProvider pageCount={9} initialPageIndex={2}>
        <MobilePageDots />
      </DashboardPagerProvider>
    );

    const dots = screen.getByTestId("mobile-page-dots").querySelectorAll(".mobile-page-dot");
    expect(dots).toHaveLength(7);
    expect(dots[2]).toHaveClass("mobile-page-dot--active");
  });

  it("change de page au tap sur un dot", () => {
    render(
      <DashboardPagerProvider pageCount={9} initialPageIndex={0}>
        <MobilePageDots />
      </DashboardPagerProvider>
    );

    fireEvent.click(screen.getByTestId("mobile-page-dot-4"));
    expect(screen.getByTestId("mobile-page-dot-4")).toHaveClass("mobile-page-dot--active");
  });
});
