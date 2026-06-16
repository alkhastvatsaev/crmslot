import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import ClientMobileApp from "@/features/company/components/ClientMobileApp";

jest.mock("@/features/company/components/CompanyHubPage", () => ({
  __esModule: true,
  default: () => <div data-testid="company-hub-page-mock" />,
}));

jest.mock("@/features/map/components/DashboardGalaxyLayer", () => ({
  __esModule: true,
  default: () => <div data-testid="client-galaxy-layer" />,
}));

describe("ClientMobileApp", () => {
  it("monte la shell client avec calendrier, hub et galaxy dock", () => {
    render(<ClientMobileApp />);
    expect(screen.getByTestId("client-mobile-app")).toBeInTheDocument();
    expect(screen.getByTestId("client-mobile-header-calendar")).toBeInTheDocument();
    expect(screen.getByTestId("client-mobile-page-0")).toBeInTheDocument();
    expect(screen.getByTestId("company-hub-page-mock")).toBeInTheDocument();
    expect(screen.getByTestId("client-mobile-shell-footer")).toBeInTheDocument();
    expect(screen.getByTestId("client-galaxy-layer")).toBeInTheDocument();
  });
});
