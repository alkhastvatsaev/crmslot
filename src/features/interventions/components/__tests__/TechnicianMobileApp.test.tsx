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

jest.mock("@/features/app/DesktopOnlyGate", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
      roleLabel: "collaborateur",
    },
    ready: true,
    signingOut: false,
    handleSignOut: jest.fn(),
  }),
}));

describe("TechnicianMobileApp", () => {
  it("monte la shell terrain avec calendrier, hub et dock profil", () => {
    render(<TechnicianMobileApp />);
    expect(screen.getByTestId("technician-mobile-app")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-header-calendar")).toBeInTheDocument();
    expect(screen.queryByTestId("technician-mobile-header-profile")).not.toBeInTheDocument();
    expect(screen.getByTestId("technician-hub-slot-0")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-shell-footer")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-profile-dock")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-profile-chip")).toBeInTheDocument();
    expect(screen.queryByTestId("technician-galaxy-layer")).not.toBeInTheDocument();
  });

  it("clic profil dock ouvre le panneau compte avec déconnexion", () => {
    render(<TechnicianMobileApp />);

    expect(screen.getByTestId("technician-profile-first-name")).toHaveTextContent("Jean");

    fireEvent.click(screen.getByTestId("technician-mobile-profile-chip"));

    expect(screen.getByTestId("dashboard-account-panel-host")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-account-signout")).toBeInTheDocument();
  });
});
