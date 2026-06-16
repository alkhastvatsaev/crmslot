import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import ClientMobileApp from "@/features/company/components/ClientMobileApp";

jest.mock("@/features/company/components/CompanyHubPage", () => ({
  __esModule: true,
  default: () => <div data-testid="company-hub-page-mock" />,
}));

jest.mock("@/features/auth/components/LoginOverlay", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("ClientMobileApp", () => {
  it("monte la shell client avec le hub société", () => {
    render(<ClientMobileApp />);
    expect(screen.getByTestId("client-mobile-app")).toBeInTheDocument();
    expect(screen.getByTestId("client-mobile-page-0")).toBeInTheDocument();
    expect(screen.getByTestId("company-hub-page-mock")).toBeInTheDocument();
  });
});
