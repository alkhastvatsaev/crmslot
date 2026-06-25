import { render, screen } from "@/test-utils/render";
import MobileScreenHost from "@/features/dashboard/components/MobileScreenHost";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";

describe("MobileScreenHost", () => {
  it("ne monte que la page active (démontage thermique)", () => {
    render(
      <DashboardPagerProvider pageCount={3} initialPageIndex={1}>
        <DashboardPageSelectorProvider>
          <MobileScreenHost
            pages={[
              <div key="0">Page A</div>,
              <div key="1">Page B</div>,
              <div key="2">Page C</div>,
            ]}
          />
        </DashboardPageSelectorProvider>
      </DashboardPagerProvider>
    );

    expect(screen.getByText("Page B")).toBeInTheDocument();
    expect(screen.queryByText("Page A")).not.toBeInTheDocument();
    expect(screen.queryByText("Page C")).not.toBeInTheDocument();
    expect(screen.getByText("Page B").closest("[aria-hidden=\'false\']")).toBeTruthy();
  });
});
