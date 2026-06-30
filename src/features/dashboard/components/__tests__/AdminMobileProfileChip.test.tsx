import { fireEvent, render, screen } from "@/test-utils/render";
import { DateProvider } from "@/context/DateContext";
import AdminMobileProfileChip from "@/features/dashboard/components/AdminMobileProfileChip";
import {
  DashboardPageSelectorProvider,
  useDashboardPageSelector,
} from "@/features/dashboard/DashboardPageSelectorContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import { useCrmStaffAccountPanel } from "@/features/auth/hooks/useCrmStaffAccountPanel";

jest.mock("@/features/auth/hooks/useCrmStaffAccountPanel", () => ({
  useCrmStaffAccountPanel: jest.fn(),
}));

type StaffPanelState = ReturnType<typeof useCrmStaffAccountPanel>;

function mockStaffPanel(overrides: Partial<StaffPanelState> = {}): StaffPanelState {
  return {
    fields: {
      email: "admin@test.com",
      firstName: "Jean",
      lastName: "Dupont",
      phone: "",
      companyId: "co-1",
      companyName: "Test Co",
      accountRole: "admin",
    },
    draft: {
      firstName: "Jean",
      lastName: "Dupont",
      email: "admin@test.com",
      phone: "",
      companyId: "co-1",
      accountRole: "admin",
    },
    memberships: [],
    editing: false,
    ready: true,
    signingOut: false,
    saving: false,
    deleting: false,
    startEditing: jest.fn(),
    cancelEditing: jest.fn(),
    updateDraft: jest.fn(),
    handleCompanyChange: jest.fn(),
    handleSave: jest.fn().mockResolvedValue(undefined),
    handleDeleteAccount: jest.fn().mockResolvedValue(undefined),
    handleSignOut: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const useCrmStaffAccountPanelMock = useCrmStaffAccountPanel as jest.MockedFunction<
  typeof useCrmStaffAccountPanel
>;

function renderChip() {
  return render(
    <DateProvider>
      <DashboardPagerProvider pageCount={3}>
        <DashboardPageSelectorProvider>
          <AdminMobileProfileChip />
        </DashboardPageSelectorProvider>
      </DashboardPagerProvider>
    </DateProvider>
  );
}

describe("AdminMobileProfileChip", () => {
  beforeEach(() => {
    useCrmStaffAccountPanelMock.mockReturnValue(mockStaffPanel());
  });

  it("affiche prénom et rôle avec la classe chip contrat", () => {
    renderChip();

    const chip = screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.profileToggle);
    expect(chip).toHaveClass(MOBILE_SHELL_CONTRACT.layout.profileChipClass);
    expect(screen.getByTestId("admin-profile-first-name")).toHaveTextContent("Jean");
    expect(screen.getByTestId("admin-profile-role")).toBeInTheDocument();
  });

  it("toggle le panneau compte au clic", () => {
    function ViewProbe() {
      const { view } = useDashboardPageSelector();
      return <div data-testid="account-view">{view}</div>;
    }

    render(
      <DateProvider>
        <DashboardPagerProvider pageCount={3}>
          <DashboardPageSelectorProvider>
            <AdminMobileProfileChip />
            <ViewProbe />
          </DashboardPageSelectorProvider>
        </DashboardPagerProvider>
      </DateProvider>
    );

    expect(screen.getByTestId("account-view")).toHaveTextContent("closed");
    fireEvent.click(screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.profileToggle));
    expect(screen.getByTestId("account-view")).toHaveTextContent("account");
  });

  it("reste désactivé tant que le compte staff n'est pas prêt", () => {
    useCrmStaffAccountPanelMock.mockReturnValue(mockStaffPanel({ ready: false }));

    renderChip();
    expect(screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.profileToggle)).toBeDisabled();
  });
});
