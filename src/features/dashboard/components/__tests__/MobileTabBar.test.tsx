import { fireEvent, render, screen } from "@/test-utils/render";
import MobileTabBar from "@/features/dashboard/components/MobileTabBar";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";

describe("MobileTabBar", () => {
  it("change de page au tap sur un onglet", () => {
    render(
      <DashboardPagerProvider pageCount={7} initialPageIndex={0}>
        <MobileTabBar />
      </DashboardPagerProvider>
    );

    expect(screen.getByTestId("mobile-tab-0")).toHaveClass("mobile-tab-bar-item--active");

    fireEvent.click(screen.getByTestId("mobile-tab-3"));
    expect(screen.getByTestId("mobile-tab-3")).toHaveClass("mobile-tab-bar-item--active");
    expect(screen.getByTestId("mobile-tab-0")).not.toHaveClass("mobile-tab-bar-item--active");
  });
});
