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

jest.mock("@/features/map/components/DashboardGalaxyLayer", () => ({
  __esModule: true,
  default: () => <div data-testid="technician-galaxy-layer" />,
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
      roleLabel: "technician",
    },
    ready: true,
    signingOut: false,
    handleSignOut: jest.fn(),
  }),
}));

describe("TechnicianMobileApp", () => {
  it("monte la shell terrain avec calendrier, hub et galaxy dock", () => {
    render(<TechnicianMobileApp />);
    expect(screen.getByTestId("technician-mobile-app")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-header-calendar")).toBeInTheDocument();
    expect(screen.getByTestId("technician-hub-slot-0")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-shell-footer")).toBeInTheDocument();
    expect(screen.getByTestId("technician-galaxy-layer")).toBeInTheDocument();
  });

  it("swipe header puis clic profil ouvre le panneau compte avec déconnexion", () => {
    render(<TechnicianMobileApp />);

    const rail = screen.getByTestId("technician-mobile-header-rail");
    fireEvent.touchStart(rail, { touches: [{ clientX: 120, clientY: 40 }] });
    fireEvent.touchMove(rail, { touches: [{ clientX: 220, clientY: 40 }] });

    expect(screen.getByTestId("technician-mobile-header-profile")).toHaveAttribute(
      "data-mobile-header-rail-active",
      "true"
    );

    fireEvent.click(screen.getByTestId("user-profile-toggle"));

    expect(screen.getByTestId("dashboard-account-panel-host")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-account-signout")).toBeInTheDocument();
  });
});
