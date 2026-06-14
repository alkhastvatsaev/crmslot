import { fireEvent, render, screen } from "@/test-utils/render";
import MobileHubDotsBar from "@/features/dashboard/components/MobileHubDotsBar";
import {
  DashboardPageSelectorProvider,
  useDashboardPageSelector,
} from "@/features/dashboard/DashboardPageSelectorContext";
import {
  MobileHubRailProvider,
  useMobileHubRailRegistration,
} from "@/features/dashboard/MobileHubRailContext";
import { useEffect } from "react";

function RegisterDots({
  visible = true,
  activeRail = "center" as const,
}: {
  visible?: boolean;
  activeRail?: "left" | "center" | "right";
}) {
  const setRegistration = useMobileHubRailRegistration();

  useEffect(() => {
    setRegistration("test", {
      rails: ["left", "center", "right"],
      activeRail,
      visible,
      requestRail: () => {},
    });
    return () => setRegistration("test", null);
  }, [activeRail, setRegistration, visible]);

  return null;
}

describe("MobileHubDotsBar", () => {
  it("n'affiche rien sans enregistrement visible", () => {
    render(
      <MobileHubRailProvider>
        <MobileHubDotsBar />
      </MobileHubRailProvider>
    );

    expect(screen.queryByTestId("mobile-hub-dots-bar")).not.toBeInTheDocument();
  });

  it("affiche les dots sous le shell quand un hub multi-rails est actif", () => {
    render(
      <MobileHubRailProvider>
        <DashboardPageSelectorProvider>
          <RegisterDots activeRail="right" />
          <MobileHubDotsBar />
        </DashboardPageSelectorProvider>
      </MobileHubRailProvider>
    );

    expect(screen.getByTestId("mobile-hub-dots-bar")).toBeInTheDocument();
    expect(document.querySelectorAll(".mobile-hub-dot")).toHaveLength(3);
    expect(document.querySelector(".mobile-hub-dot--active")).toBeInTheDocument();
  });

  it("garde les dots visibles quand le sélecteur de pages masque le hub", () => {
    function SelectorToggle() {
      const { toggle } = useDashboardPageSelector();
      return (
        <button type="button" data-testid="toggle-selector" onClick={toggle}>
          toggle
        </button>
      );
    }

    const { rerender } = render(
      <MobileHubRailProvider>
        <DashboardPageSelectorProvider>
          <RegisterDots activeRail="center" visible />
          <MobileHubDotsBar />
          <SelectorToggle />
        </DashboardPageSelectorProvider>
      </MobileHubRailProvider>
    );

    expect(screen.getByTestId("mobile-hub-dots-bar")).toBeInTheDocument();

    rerender(
      <MobileHubRailProvider>
        <DashboardPageSelectorProvider>
          <RegisterDots activeRail="center" visible={false} />
          <MobileHubDotsBar />
          <SelectorToggle />
        </DashboardPageSelectorProvider>
      </MobileHubRailProvider>
    );

    fireEvent.click(screen.getByTestId("toggle-selector"));
    expect(screen.getByTestId("mobile-hub-dots-bar")).toBeInTheDocument();
  });
});
