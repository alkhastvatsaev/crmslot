import { fireEvent, render, screen } from "@/test-utils/render";
import DashboardAccountPanel from "@/features/dashboard/components/DashboardAccountPanel";

const handleSignOut = jest.fn();

jest.mock("@/features/auth/hooks/useCrmStaffAccountPanel", () => ({
  useCrmStaffAccountPanel: () => ({
    fields: {
      email: "test@example.com",
      firstName: "Jean",
      lastName: "Dupont",
      companyName: "ABC",
      roleLabel: "admin",
    },
    ready: true,
    signingOut: false,
    handleSignOut,
  }),
}));

describe("DashboardAccountPanel", () => {
  beforeEach(() => {
    handleSignOut.mockClear();
  });

  it("affiche les champs du compte et le bouton déconnexion", () => {
    render(<DashboardAccountPanel onClose={jest.fn()} variant="mobile" />);

    expect(screen.getByTestId("dashboard-account-first-name")).toHaveTextContent("Jean");
    expect(screen.getByTestId("dashboard-account-last-name")).toHaveTextContent("Dupont");
    expect(screen.getByTestId("dashboard-account-email")).toHaveTextContent("test@example.com");
    expect(screen.getByTestId("dashboard-account-company")).toHaveTextContent("ABC");
    expect(screen.getByTestId("dashboard-account-role")).toHaveTextContent("Administrateur");
    expect(screen.getByTestId("dashboard-account-signout")).toBeInTheDocument();
  });

  it("appelle handleSignOut au clic déconnexion", () => {
    render(<DashboardAccountPanel onClose={jest.fn()} variant="mobile" />);
    fireEvent.click(screen.getByTestId("dashboard-account-signout"));
    expect(handleSignOut).toHaveBeenCalledTimes(1);
  });

  it("ferme via le bouton close", () => {
    const onClose = jest.fn();
    render(<DashboardAccountPanel onClose={onClose} variant="desktop" />);
    fireEvent.click(screen.getByTestId("dashboard-account-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
