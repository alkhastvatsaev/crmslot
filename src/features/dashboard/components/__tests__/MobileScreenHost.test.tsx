import { render, screen } from "@/test-utils/render";
import MobileScreenHost from "@/features/dashboard/components/MobileScreenHost";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";

describe("MobileScreenHost", () => {
  it("affiche la page active et garde la carte montée en arrière-plan", () => {
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
    expect(screen.getByText("Page A")).toBeInTheDocument();
    expect(screen.queryByText("Page C")).not.toBeInTheDocument();
    expect(screen.getByText("Page A").closest("[aria-hidden=\'true\']")).toBeTruthy();
    expect(screen.getByText("Page B").closest("[aria-hidden=\'false\']")).toBeTruthy();
  });
});
