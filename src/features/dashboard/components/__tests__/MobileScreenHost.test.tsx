import { fireEvent, render, screen } from "@/test-utils/render";
import MobileScreenHost from "@/features/dashboard/components/MobileScreenHost";
import {
  DashboardPagerProvider,
  useDashboardPager,
} from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";

function PageSwitcher() {
  const { setPageIndex } = useDashboardPager();
  return (
    <button type="button" onClick={() => setPageIndex(0)}>
      go-map
    </button>
  );
}

describe("MobileScreenHost", () => {
  it("affiche la page active sans garder la carte montée hors page 0", () => {
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

  it("remonte la carte quand on revient sur la page 0", () => {
    render(
      <DashboardPagerProvider pageCount={2} initialPageIndex={1}>
        <DashboardPageSelectorProvider>
          <PageSwitcher />
          <MobileScreenHost pages={[<div key="0">Page A</div>, <div key="1">Page B</div>]} />
        </DashboardPageSelectorProvider>
      </DashboardPagerProvider>
    );

    expect(screen.queryByText("Page A")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "go-map" }));
    expect(screen.getByText("Page A")).toBeInTheDocument();
    expect(screen.getByText("Page A").closest("[aria-hidden=\'false\']")).toBeTruthy();
  });
});
