import { render, screen } from "@/test-utils/render";
import MobileScreenHost from "@/features/dashboard/components/MobileScreenHost";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";

describe("MobileScreenHost", () => {
  it("n'affiche que la page active", () => {
    render(
      <DashboardPagerProvider pageCount={3} initialPageIndex={1}>
        <MobileScreenHost
          pages={[<div key="0">Page A</div>, <div key="1">Page B</div>, <div key="2">Page C</div>]}
        />
      </DashboardPagerProvider>
    );

    expect(screen.getByText("Page B")).toBeInTheDocument();
    expect(screen.queryByText("Page A")).not.toBeInTheDocument();
    expect(screen.queryByText("Page C")).not.toBeInTheDocument();
  });
});
