import { fireEvent, render, screen } from "@/test-utils/render";
import MobilePager from "@/features/dashboard/components/MobilePager";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";

function renderMobilePager(pageCount = 3, initialPageIndex = 0) {
  const pages = [
    <div key="0" data-testid="page-a">
      A
    </div>,
    <div key="1" data-testid="page-b">
      B
    </div>,
    <div key="2" data-testid="page-c">
      C
    </div>,
  ].slice(0, pageCount);

  return render(
    <DashboardPagerProvider pageCount={pageCount} initialPageIndex={initialPageIndex}>
      <div className="h-[400px]">
        <MobilePager pages={pages} />
      </div>
    </DashboardPagerProvider>
  );
}

describe("MobilePager", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return 400;
      },
    });
  });

  it("sync scroll position to pageIndex on swipe", () => {
    renderMobilePager(3, 0);
    const pager = screen.getByTestId("mobile-pager");

    Object.defineProperty(pager, "scrollTop", { configurable: true, value: 400, writable: true });
    fireEvent.scroll(pager);

    expect(screen.getByTestId("page-b")).toBeInTheDocument();
  });
});
