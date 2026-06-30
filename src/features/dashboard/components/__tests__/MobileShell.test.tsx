import { screen, fireEvent } from "@/test-utils/render";
import { renderMobileShell } from "@/test-utils/renderMobileShell";

jest.mock("@/features/map/components/MapGalaxyTranscriptionLayer", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/features/auth/hooks/useCrmStaffAccountPanel", () => ({
  useCrmStaffAccountPanel: () => ({
    fields: {
      email: "admin@test.com",
      firstName: "Jean",
      lastName: "Dupont",
      companyName: "Test Co",
      roleLabel: "admin",
    },
    ready: true,
    signingOut: false,
    signOut: jest.fn(),
  }),
}));
describe("MobileShell", () => {
  it("compose header, écran unique et footer", () => {
    renderMobileShell([<div key="0">Hub A</div>, <div key="1">Hub B</div>]);

    expect(screen.getByTestId("mobile-shell")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-footer-calendar")).toBeInTheDocument();
    expect(screen.getByTestId("admin-mobile-profile-chip")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-screen-host")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-shell-footer")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-hub-dots-bar")).toBeInTheDocument();
    expect(document.querySelectorAll(".mobile-hub-dot")).toHaveLength(0);
    expect(screen.getByText("Hub A")).toBeInTheDocument();
  });

  it("affiche le panneau compte dans le panneau central au clic profil", () => {
    renderMobileShell([<div key="0">A</div>, <div key="1">B</div>]);

    expect(screen.queryByTestId("dashboard-account-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("mobile-page-0")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("admin-mobile-profile-chip"));
    expect(screen.getByTestId("dashboard-account-panel-host")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-account-panel")).toBeInTheDocument();
    expect(screen.getByText("A").closest("[aria-hidden='true']")).toBeTruthy();
  });

  it("affiche le sélecteur dans le panneau central au clic calendrier", () => {
    renderMobileShell([<div key="0">A</div>, <div key="1">B</div>]);

    fireEvent.click(screen.getByTestId("clock-calendar-toggle"));
    expect(screen.getByTestId("dashboard-page-selector-host")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-page-selector")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("dashboard-page-selector-item-1"));
    expect(screen.queryByTestId("dashboard-page-selector")).not.toBeInTheDocument();
    expect(screen.getByTestId("mobile-page-1")).toBeInTheDocument();
  });
});
