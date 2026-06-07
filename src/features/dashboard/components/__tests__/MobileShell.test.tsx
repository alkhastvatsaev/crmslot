import { render, screen, fireEvent } from "@/test-utils/render";
import MobileShell from "@/features/dashboard/components/MobileShell";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";

jest.mock("@/features/dashboard/components/MobileTopBar", () => ({
  __esModule: true,
  default: ({ onToggle }: { onToggle?: () => void }) => (
    <button data-testid="mobile-top-bar" onClick={onToggle} />
  ),
}));

jest.mock("@/features/map/components/DashboardGalaxyLayer", () => ({
  __esModule: true,
  default: () => <div data-testid="galaxy-layer" />,
}));

jest.mock("@/features/dashboard/components/MobilePageSelector", () => ({
  __esModule: true,
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    <div data-testid="mobile-page-selector" data-open={String(open)}>
      <button data-testid="close-selector" onClick={onClose} />
    </div>
  ),
}));

describe("MobileShell", () => {
  it("compose header, écran unique et footer", () => {
    render(
      <DashboardPagerProvider pageCount={2}>
        <MobileShell pages={[<div key="0">Hub A</div>, <div key="1">Hub B</div>]} />
      </DashboardPagerProvider>
    );

    expect(screen.getByTestId("mobile-shell")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-top-bar")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-screen-host")).toBeInTheDocument();
    expect(screen.getByText("Hub A")).toBeInTheDocument();
  });

  it("toggle le sélecteur de pages au clic sur le top bar", () => {
    render(
      <DashboardPagerProvider pageCount={2}>
        <MobileShell pages={[<div key="0">A</div>]} />
      </DashboardPagerProvider>
    );

    const selector = screen.getByTestId("mobile-page-selector");
    expect(selector).toHaveAttribute("data-open", "false");

    fireEvent.click(screen.getByTestId("mobile-top-bar"));
    expect(selector).toHaveAttribute("data-open", "true");

    fireEvent.click(screen.getByTestId("mobile-top-bar"));
    expect(selector).toHaveAttribute("data-open", "false");
  });
});
