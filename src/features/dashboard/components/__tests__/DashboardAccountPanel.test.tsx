import { fireEvent, render, screen } from "@/test-utils/render";
import DashboardAccountPanel from "@/features/dashboard/components/DashboardAccountPanel";

const handleSignOut = jest.fn();
const startEditing = jest.fn();
const cancelEditing = jest.fn();
const updateDraft = jest.fn();
const handleCompanyChange = jest.fn();
const handleSave = jest.fn();
const handleDeleteAccount = jest.fn();

let editing = false;

jest.mock("@/features/auth/hooks/useCrmStaffAccountPanel", () => ({
  useCrmStaffAccountPanel: () => ({
    fields: {
      email: "test@example.com",
      firstName: "Jean",
      lastName: "Dupont",
      phone: "+32 470 00 00 00",
      companyId: "co-1",
      companyName: "ABC",
      roleLabel: "admin",
    },
    draft: {
      email: "test@example.com",
      firstName: "Jean",
      lastName: "Dupont",
      phone: "+32 470 00 00 00",
      companyId: "co-1",
      role: "admin",
    },
    memberships: [{ companyId: "co-1", companyName: "ABC", role: "admin" }],
    editing,
    ready: true,
    signingOut: false,
    saving: false,
    deleting: false,
    startEditing,
    cancelEditing,
    updateDraft,
    handleCompanyChange,
    handleSave,
    handleDeleteAccount,
    handleSignOut,
  }),
}));

describe("DashboardAccountPanel", () => {
  beforeEach(() => {
    editing = false;
    handleSignOut.mockClear();
    startEditing.mockClear();
    cancelEditing.mockClear();
    handleSave.mockClear();
    handleDeleteAccount.mockClear();
  });

  it("affiche le profil compact et les boutons modifier / déconnexion", () => {
    render(<DashboardAccountPanel onClose={jest.fn()} variant="mobile" />);

    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-account-phone")).toHaveTextContent("+32 470 00 00 00");
    expect(screen.getByTestId("dashboard-account-company")).toHaveTextContent("ABC");
    expect(screen.getByTestId("dashboard-account-role-badge")).toHaveTextContent("ADMIN");
    expect(screen.getByTestId("dashboard-account-edit")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-account-signout")).toBeInTheDocument();
  });

  it("passe en mode édition et affiche sauvegarder / supprimer", () => {
    editing = true;
    render(<DashboardAccountPanel onClose={jest.fn()} variant="mobile" />);

    expect(screen.getByTestId("dashboard-account-first-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-account-save")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-account-delete")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-account-edit")).not.toBeInTheDocument();
  });

  it("appelle startEditing au clic modifier", () => {
    render(<DashboardAccountPanel onClose={jest.fn()} variant="mobile" />);
    fireEvent.click(screen.getByTestId("dashboard-account-edit"));
    expect(startEditing).toHaveBeenCalledTimes(1);
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
