import { render, screen } from "@/test-utils/render";
import * as mobileFooterGalaxyVisible from "@/features/dashboard/hooks/useMobileFooterGalaxyVisible";
import AdminMobileApp from "@/features/dashboard/components/AdminMobileApp";

jest.mock("@/features/map/components/MapboxView", () => ({
  __esModule: true,
  default: () => <div data-testid="mapbox-view-stub" />,
}));

jest.mock("@/features/dashboard/hooks/useMobileFooterGalaxyVisible", () => ({
  useMobileFooterGalaxyVisible: jest.fn(() => false),
  useMobileHubAgentRailActive: jest.fn(() => false),
}));

describe("AdminMobileApp", () => {
  it("monte la shell admin et MapboxView", async () => {
    jest.mocked(mobileFooterGalaxyVisible.useMobileFooterGalaxyVisible).mockReturnValue(true);
    render(<AdminMobileApp />);
    expect(screen.getByTestId("admin-mobile-app")).toBeInTheDocument();
    expect(await screen.findByTestId("mapbox-view-stub")).toBeInTheDocument();
    expect(screen.getByTestId("admin-mobile-shell-dock")).toBeInTheDocument();
  });
});
