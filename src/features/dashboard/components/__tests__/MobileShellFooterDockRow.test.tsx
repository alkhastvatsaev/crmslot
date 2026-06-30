import { render, screen } from "@/test-utils/render";
import { DateProvider } from "@/context/DateContext";
import MobileShellFooterDockRow from "@/features/dashboard/components/MobileShellFooterDockRow";
import { MobileHubRailProvider } from "@/features/dashboard/MobileHubRailContext";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import * as mobileFooterGalaxyVisible from "@/features/dashboard/hooks/useMobileFooterGalaxyVisible";

jest.mock("@/features/dashboard/hooks/useMobileFooterGalaxyVisible", () => ({
  useMobileFooterGalaxyVisible: jest.fn(() => false),
  useMobileHubAgentRailActive: jest.fn(() => false),
}));

function renderFooterRow(ui: React.ReactElement) {
  return render(
    <DateProvider>
      <MobileHubRailProvider>{ui}</MobileHubRailProvider>
    </DateProvider>
  );
}

describe("MobileShellFooterDockRow", () => {
  beforeEach(() => {
    jest.mocked(mobileFooterGalaxyVisible.useMobileFooterGalaxyVisible).mockReturnValue(false);
  });

  it("affiche le calendrier footer quand Galaxy est masqué", () => {
    renderFooterRow(<MobileShellFooterDockRow />);

    expect(screen.getByTestId("mobile-shell-footer")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-footer-calendar-bar")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-footer-calendar")).toBeInTheDocument();
    expect(screen.getByTestId("clock-calendar-widget")).toBeInTheDocument();
    expect(screen.queryByTestId(MOBILE_SHELL_CONTRACT.testIds.galaxyDock)).not.toBeInTheDocument();
    expect(screen.getByTestId("mobile-hub-dots-bar")).toBeInTheDocument();
  });

  it("affiche le dock Galaxy custom quand le rail agent est actif", () => {
    jest.mocked(mobileFooterGalaxyVisible.useMobileFooterGalaxyVisible).mockReturnValue(true);

    renderFooterRow(
      <MobileShellFooterDockRow dock={<div data-testid="mock-galaxy-dock">Galaxy</div>} />
    );

    expect(screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.galaxyDock)).toBeInTheDocument();
    expect(screen.getByTestId("mock-galaxy-dock")).toBeInTheDocument();
    expect(screen.queryByTestId("mobile-footer-calendar")).not.toBeInTheDocument();
  });
});
