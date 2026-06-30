import { fireEvent, screen } from "@/test-utils/render";
import MobileNavDrawer from "@/features/dashboard/components/MobileNavDrawer";
import { getDashboardCarouselHubPages } from "@/features/dashboard/dashboardCarouselRegistry";
import { useDashboardPager } from "@/features/dashboard/dashboardPagerContext";
import { renderWithPager } from "@/test-utils/renderWithPager";

function PageIndexProbe() {
  const { pageIndex } = useDashboardPager();
  return <div data-testid="page-index">{pageIndex}</div>;
}

describe("MobileNavDrawer", () => {
  const hubCount = getDashboardCarouselHubPages().length;

  it("affiche le profil et une entrée par hub carrousel", () => {
    renderWithPager(
      <MobileNavDrawer open profileName="Jean Dupont" profileRoleKey="admin" onClose={jest.fn()} />,
      9
    );

    expect(screen.getByTestId("mobile-nav-drawer")).toHaveAttribute("data-open", "true");
    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getByText("J")).toBeInTheDocument();
    expect(document.querySelectorAll(".mobile-nav-drawer-item")).toHaveLength(hubCount);
  });

  it("ferme au clic backdrop et sur Escape", () => {
    const onClose = jest.fn();
    renderWithPager(
      <MobileNavDrawer open={false} profileName="Jean" profileRoleKey="admin" onClose={onClose} />,
      9
    );

    expect(screen.getByTestId("mobile-nav-drawer")).toHaveAttribute("data-open", "false");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    renderWithPager(
      <MobileNavDrawer open profileName="Jean" profileRoleKey="admin" onClose={onClose} />,
      9
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(document.querySelector(".mobile-nav-drawer-backdrop")!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("navigue vers le hub cliqué puis ferme", () => {
    const onClose = jest.fn();
    const targetIndex = 2;

    renderWithPager(
      <>
        <PageIndexProbe />
        <MobileNavDrawer open profileName="Jean" profileRoleKey="admin" onClose={onClose} />
      </>,
      9,
      { initialPageIndex: 0 }
    );

    const buttons = document.querySelectorAll(".mobile-nav-drawer-item");
    fireEvent.click(buttons[targetIndex]!);

    expect(screen.getByTestId("page-index")).toHaveTextContent(String(targetIndex));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
