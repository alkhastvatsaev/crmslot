import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import TechnicianMobileProfileChip from "@/features/interventions/components/TechnicianMobileProfileChip";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";

jest.mock("@/features/auth/hooks/useCrmStaffAccountPanel", () => ({
  useCrmStaffAccountPanel: () => ({
    fields: {
      email: "tony@example.com",
      firstName: "Tony",
      lastName: "Stark",
      companyName: "ABC",
      roleLabel: "collaborateur",
    },
    ready: true,
    signingOut: false,
    handleSignOut: jest.fn(),
  }),
}));

describe("TechnicianMobileProfileChip", () => {
  it("shows first name and technician role in footer chip", () => {
    render(
      <DashboardPageSelectorProvider>
        <TechnicianMobileProfileChip />
      </DashboardPageSelectorProvider>
    );

    expect(screen.getByTestId("technician-mobile-profile-chip")).toBeInTheDocument();
    expect(screen.getByTestId("technician-profile-first-name")).toHaveTextContent("Tony");
    expect(screen.getByTestId("technician-profile-role")).toHaveTextContent(/technicien/i);
  });

  it("opens account panel on click", () => {
    render(
      <DashboardPageSelectorProvider>
        <TechnicianMobileProfileChip />
      </DashboardPageSelectorProvider>
    );

    fireEvent.click(screen.getByTestId("technician-mobile-profile-chip"));
    expect(screen.getByTestId("technician-mobile-profile-chip")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });
});
