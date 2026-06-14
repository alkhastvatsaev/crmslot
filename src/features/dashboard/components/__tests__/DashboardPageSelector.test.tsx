import { render, screen, fireEvent } from "@/test-utils/render";
import DashboardPageSelector from "@/features/dashboard/components/DashboardPageSelector";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";

describe("DashboardPageSelector", () => {
  it("navigue vers la page choisie et ferme le sélecteur", () => {
    const onClose = jest.fn();

    render(
      <DashboardPagerProvider pageCount={8}>
        <DashboardPageSelector onClose={onClose} variant="desktop" />
      </DashboardPagerProvider>
    );

    expect(screen.getByTestId("dashboard-page-selector")).toHaveAttribute(
      "data-variant",
      "desktop"
    );
    expect(screen.getByTestId("dashboard-language-selector")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-language-fr")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("dashboard-page-selector-item-4"));
    expect(onClose).toHaveBeenCalled();
  });
});
