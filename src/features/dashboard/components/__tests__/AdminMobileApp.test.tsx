import { render, screen } from "@/test-utils/render";
import AdminMobileApp from "@/features/dashboard/components/AdminMobileApp";

jest.mock("@/features/map/components/MapboxView", () => ({
  __esModule: true,
  default: () => <div data-testid="mapbox-view-stub" />,
}));

describe("AdminMobileApp", () => {
  it("monte la shell admin et MapboxView", async () => {
    render(<AdminMobileApp />);
    expect(screen.getByTestId("admin-mobile-app")).toBeInTheDocument();
    expect(await screen.findByTestId("mapbox-view-stub")).toBeInTheDocument();
    expect(screen.getByTestId("admin-mobile-shell-dock")).toBeInTheDocument();
  });
});
