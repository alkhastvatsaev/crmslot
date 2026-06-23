import { render, screen } from "@/test-utils/render";
import AdminMobileApp from "@/features/dashboard/components/AdminMobileApp";

jest.mock("@/features/map/components/MobileMapHubLite", () => ({
  __esModule: true,
  default: () => <div data-testid="mobile-map-hub-lite-stub" />,
}));

describe("AdminMobileApp", () => {
  it("monte la shell admin, la carte lite et le lien CRM complet", async () => {
    render(<AdminMobileApp />);
    expect(screen.getByTestId("admin-mobile-app")).toBeInTheDocument();
    expect(await screen.findByTestId("mobile-map-hub-lite-stub")).toBeInTheDocument();
    expect(screen.getByTestId("admin-mobile-full-crm-link")).toHaveAttribute("href", "/?fullCrm=1");
  });
});
