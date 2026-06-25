import { fireEvent, render, screen } from "@/test-utils/render";
import TechnicianMobileApp from "@/features/interventions/components/TechnicianMobileApp";

jest.mock("@/features/auth/components/TechnicianLoginGate", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/features/interventions/components/TechnicianHubPage", () => ({
  __esModule: true,
  default: ({ slotIndex }: { slotIndex: number }) => (
    <div data-testid={`technician-hub-slot-${slotIndex}`} />
  ),
}));

jest.mock("@/features/dev/DevServiceWorkerCleanup", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/features/notifications/components/TechnicianNotificationBootstrap", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/features/auth/hooks/useCrmStaffAccountPanel", () => ({
  useCrmStaffAccountPanel: () => ({
    fields: {
      email: "tech@example.com",
      firstName: "Jean",
      lastName: "Martin",
      companyName: "ABC",
      accountRole: "technician",
    },
    ready: true,
    signingOut: false,
    handleSignOut: jest.fn(),
  }),
}));

describe("TechnicianMobileApp", () => {
  it("monte la shell terrain avec profil header, hub et calendrier footer", () => {
    render(<TechnicianMobileApp />);
    expect(screen.getByTestId("technician-mobile-app")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-header-profile")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-footer-calendar")).toBeInTheDocument();
    expect(screen.getByTestId("technician-hub-slot-0")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-shell-footer")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-profile-chip")).toBeInTheDocument();
    expect(screen.queryByTestId("technician-galaxy-layer")).not.toBeInTheDocument();
  });

  it("clic profil header ouvre le panneau compte avec déconnexion", () => {
    render(<TechnicianMobileApp />);

    expect(screen.getByTestId("technician-profile-first-name")).toHaveTextContent("Jean");

    fireEvent.click(screen.getByTestId("technician-mobile-profile-chip"));

    expect(screen.getByTestId("dashboard-account-panel-host")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-account-signout")).toBeInTheDocument();
  });
});
