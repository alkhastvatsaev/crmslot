import React from "react";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { render } from "@testing-library/react";
import { I18nProvider } from "@/core/i18n/I18nContext";
import { DateProvider } from "@/context/DateContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { assignInterventionFromBackoffice } from "@/features/backoffice/assignInterventionFromBackoffice";
import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import type { Intervention } from "@/features/interventions/types";
import BackOfficeInboxPanel from "@/features/backoffice/components/BackOfficeInboxPanel";

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: jest.fn(),
}));

jest.mock("@/features/backoffice/useBackOfficeInterventions", () => ({
  useBackOfficeInterventions: jest.fn(),
}));

jest.mock("@/features/backoffice/useResolvedInterventionAudio", () => ({
  useResolvedInterventionAudio: jest.fn(() => ({
    resolvedAudioUrl: null,
    isResolvingAudio: false,
    audioStorageResolveFailed: false,
  })),
}));

jest.mock("@/features/backoffice/assignInterventionFromBackoffice", () => ({
  assignInterventionFromBackoffice: jest.fn(async () => undefined),
}));

jest.mock("@/core/config/firebase", () => ({
  firestore: {},
  auth: { currentUser: { uid: "ivana-uid" } },
  isConfigured: true,
}));

jest.mock("@/features/technicians/hooks", () => ({
  useTechnicians: jest.fn(() => ({
    technicians: [
      {
        id: "mansour",
        name: "Mansour",
        initial: "M",
        vehicle: "Van",
        status: "available",
        authUid: getDefaultAssignedTechnicianUid(),
        location: { lat: 50.848, lng: 4.352 },
      },
    ],
    loading: false,
  })),
}));

jest.mock("@/features/dispatch/algorithm", () => ({
  findBestTechnician: jest.fn(async () => null),
}));

jest.mock("@/features/reminders/useBackofficeReminderPush", () => ({
  useBackofficeReminderPush: jest.fn(),
}));

jest.mock("@/context/TechnicianCaseIntentContext", () => ({
  useTechnicianCaseIntent: () => ({ setPendingCaseId: jest.fn() }),
}));

jest.mock("@/context/BackofficeInboxIntentContext", () => ({
  useBackofficeInboxIntentOptional: () => ({
    pendingInboxId: null,
    setPendingInboxId: jest.fn(),
    selectedInboxInterventionId: null,
    setSelectedInboxInterventionId: jest.fn(),
    pendingChatInterventionId: null,
    setPendingChatInterventionId: jest.fn(),
  }),
}));

jest.mock("@/features/dashboard/dashboardPagerContext", () => ({
  useDashboardPagerOptional: () => ({ setPageIndex: jest.fn() }),
}));

jest.mock("@/features/interventions/technicianHubNavigation", () => ({
  navigateTechnicianHub: jest.fn(),
  TECHNICIAN_HUB_ANCHOR_MISSIONS: "missions",
}));

jest.mock("@/features/chatbot/components/ChatbotDocumentsRightPanel", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/features/backoffice/components/IvanaClientChatPanel", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/features/backoffice/components/ChatDayClientsPicker", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: jest.fn(() => false),
}));

const mockWorkspace = useCompanyWorkspaceOptional as jest.MockedFunction<
  typeof useCompanyWorkspaceOptional
>;
const mockUseBackOffice = useBackOfficeInterventions as jest.MockedFunction<
  typeof useBackOfficeInterventions
>;
const mockAssign = assignInterventionFromBackoffice as jest.MockedFunction<
  typeof assignInterventionFromBackoffice
>;

const pendingRequest: Intervention = {
  id: "req-inbox-1",
  companyId: "co-1",
  title: "Porte bloquée",
  address: "Rue Neuve 10, Bruxelles",
  time: "11:00",
  status: "pending",
  location: { lat: 50.85, lng: 4.35 },
  clientFirstName: "Jean",
  clientLastName: "Martin",
  createdAt: "2026-05-20T08:00:00.000Z",
};

function mockTenantWorkspace() {
  mockWorkspace.mockReturnValue({
    isTenantUser: true,
    activeCompanyId: "co-1",
    memberships: [{ companyId: "co-1", companyName: "Test Co", role: "admin" }],
    firebaseUid: "ivana-uid",
    setActiveCompanyId: jest.fn(),
    activeRole: "admin",
    refreshClaimsSilent: jest.fn(async () => true),
  } as unknown as NonNullable<ReturnType<typeof useCompanyWorkspaceOptional>>);
}

function renderInbox(ui: React.ReactElement) {
  return render(
    <I18nProvider>
      <DateProvider>{ui}</DateProvider>
    </I18nProvider>
  );
}

describe("BackOfficeInboxPanel — onglet Demandes (A→Z)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTenantWorkspace();
    mockUseBackOffice.mockReturnValue({
      interventions: [pendingRequest],
      loading: false,
      error: null,
      firebaseUid: "ivana-uid",
    });
    mockAssign.mockResolvedValue(undefined);
  });

  function openRequestsTab() {
    fireEvent.click(screen.getByTestId("backoffice-inbox-tab-requests"));
  }

  it("affiche l’onglet Demandes et la carte pending", () => {
    renderInbox(<BackOfficeInboxPanel />);
    expect(screen.getByTestId("backoffice-inbox-panel")).toBeInTheDocument();
    openRequestsTab();
    expect(screen.getByTestId("backoffice-inbox-request-row-req-inbox-1")).toBeInTheDocument();
  });

  it("affiche une mission assigned non acceptée dans Demandes", () => {
    mockUseBackOffice.mockReturnValue({
      interventions: [
        {
          ...pendingRequest,
          id: "req-assigned-stuck",
          status: "assigned",
          assignedTechnicianUid: getDefaultAssignedTechnicianUid(),
        },
      ],
      loading: false,
      error: null,
      firebaseUid: "ivana-uid",
    });
    renderInbox(<BackOfficeInboxPanel />);
    openRequestsTab();
    expect(
      screen.getByTestId("backoffice-inbox-request-row-req-assigned-stuck")
    ).toBeInTheDocument();
  });

  it("remplace annuler/supprimer par Modifier dans le détail demande", async () => {
    renderInbox(<BackOfficeInboxPanel />);
    openRequestsTab();
    fireEvent.click(screen.getByTestId("backoffice-inbox-request-row-req-inbox-1"));

    const detail = await screen.findByTestId("backoffice-inbox-detail");
    expect(within(detail).queryByTestId("backoffice-inbox-cancel")).not.toBeInTheDocument();
    expect(within(detail).queryByText(/Supprimer/i)).not.toBeInTheDocument();

    fireEvent.click(within(detail).getByTestId("backoffice-inbox-edit"));
    const editor = await within(detail).findByTestId("backoffice-inbox-schedule-editor");
    expect(within(editor).getByText(/Créneaux libres/i)).toBeInTheDocument();
    expect(within(editor).getByTestId("proposed-schedule-date")).toBeInTheDocument();
    expect(within(editor).getByTestId("backoffice-inbox-schedule-cancel")).toBeInTheDocument();
    expect(within(editor).getByTestId("backoffice-inbox-schedule-save")).toHaveTextContent(
      /Sauver/i
    );
  });

  it("ouvre le détail puis assigne via transition workflow", async () => {
    renderInbox(<BackOfficeInboxPanel />);
    openRequestsTab();

    fireEvent.click(screen.getByTestId("backoffice-inbox-request-row-req-inbox-1"));

    const detail = await screen.findByTestId("backoffice-inbox-detail");
    expect(within(detail).getByText(/Martin|Jean/)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("backoffice-inbox-assign"));

    const picker = await screen.findByTestId("technician-assign-picker");
    expect(within(picker).queryByTestId("proposed-schedule-slots")).not.toBeInTheDocument();
    const confirm = within(picker).getByTestId("technician-assign-confirm");
    await waitFor(() => expect(confirm).not.toBeDisabled());
    fireEvent.click(confirm);

    await waitFor(() => expect(mockAssign).toHaveBeenCalledTimes(1));
    expect(mockAssign.mock.calls[0]?.[0]).toBe("req-inbox-1");
    expect(mockAssign.mock.calls[0]?.[2]).toBe(getDefaultAssignedTechnicianUid());
  });

  it("affiche le picker même si location absente (repli coordonnées)", async () => {
    mockUseBackOffice.mockReturnValue({
      interventions: [
        {
          ...pendingRequest,
          id: "req-no-loc",
          location: undefined as unknown as Intervention["location"],
        },
      ],
      loading: false,
      error: null,
      firebaseUid: "ivana-uid",
    });

    renderInbox(<BackOfficeInboxPanel />);
    openRequestsTab();
    fireEvent.click(screen.getByTestId("backoffice-inbox-request-row-req-no-loc"));
    fireEvent.click(screen.getByTestId("backoffice-inbox-assign"));

    expect(await screen.findByTestId("technician-assign-picker")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("technician-assign-confirm")).not.toBeDisabled());
  });
});
