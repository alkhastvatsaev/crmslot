import { render, screen } from "@/test-utils/render";
import MobileShellGalaxyDockSlot from "@/features/dashboard/components/MobileShellGalaxyDockSlot";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import {
  MOBILE_GALAXY_DOCK_CHROME_CLASS,
  MOBILE_GALAXY_DOCK_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import * as mobileFooterGalaxyVisible from "@/features/dashboard/hooks/useMobileFooterGalaxyVisible";

jest.mock("@/features/dashboard/hooks/useMobileFooterGalaxyVisible", () => ({
  useMobileFooterGalaxyVisible: jest.fn(() => false),
  useMobileHubAgentRailActive: jest.fn(() => false),
}));

describe("MobileShellGalaxyDockSlot", () => {
  beforeEach(() => {
    jest.mocked(mobileFooterGalaxyVisible.useMobileFooterGalaxyVisible).mockReturnValue(false);
  });

  it("ne rend rien quand le dock Galaxy est masqué", () => {
    const { container } = render(
      <MobileShellGalaxyDockSlot>
        <span>contenu</span>
      </MobileShellGalaxyDockSlot>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("compose la grille dock avec testId contrat quand visible", () => {
    jest.mocked(mobileFooterGalaxyVisible.useMobileFooterGalaxyVisible).mockReturnValue(true);

    render(
      <MobileShellGalaxyDockSlot>
        <span>contenu galaxy</span>
      </MobileShellGalaxyDockSlot>
    );

    const dock = screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.galaxyDock);
    expect(dock).toHaveClass(MOBILE_GALAXY_DOCK_CLASS);
    expect(screen.getByText("contenu galaxy").parentElement).toHaveClass(
      MOBILE_GALAXY_DOCK_CHROME_CLASS
    );
  });

  it("accepte un testId custom", () => {
    jest.mocked(mobileFooterGalaxyVisible.useMobileFooterGalaxyVisible).mockReturnValue(true);

    render(
      <MobileShellGalaxyDockSlot testId="admin-mobile-shell-dock">
        <span>dock</span>
      </MobileShellGalaxyDockSlot>
    );

    expect(screen.getByTestId("admin-mobile-shell-dock")).toBeInTheDocument();
  });
});
