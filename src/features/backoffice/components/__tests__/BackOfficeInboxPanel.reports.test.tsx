import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { render } from "@testing-library/react";
import { I18nProvider } from "@/core/i18n/I18nContext";
import { DateProvider } from "@/context/DateContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
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

jest.mock("@/core/config/firebase", () => ({
  firestore: {},
  auth: { currentUser: { uid: "ivana-uid" } },
  isConfigured: true,
}));

jest.mock("@/features/technicians/hooks", () => ({
  useTechnicians: jest.fn(() => ({ technicians: [], loading: false })),
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
    activeInboxTab: null,
    setActiveInboxTab: jest.fn(),
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

const archivedReport: Intervention = {
  id: "report-archived-1",
  companyId: "co-1",
  title: "Chaudière réparée",
  address: "Avenue Louise 1, Bruxelles",
  time: "14:00",
  status: "invoiced",
  location: { lat: 50.82, lng: 4.36 },
  clientFirstName: "Marie",
  clientLastName: "Dupont",
  completedAt: "2026-05-20T12:00:00.000Z",
  invoicedAt: "2026-05-20T13:00:00.000Z",
  backofficeReportsArchivedAt: "2026-05-20T14:00:00.000Z",
};

const validatedNotArchived: Intervention = {
  ...archivedReport,
  id: "report-validated-1",
  backofficeReportsArchivedAt: undefined,
};

function mockTenantWorkspace() {
  mockWorkspace.mockReturnValue({
    isTenantUser: true,
    workspaceReady: true,
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

describe("BackOfficeInboxPanel — onglet Rapports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTenantWorkspace();
    mockUseBackOffice.mockReturnValue({
      interventions: [archivedReport],
      loading: false,
      error: null,
      firebaseUid: "ivana-uid",
    });
  });

  it("ouvre le détail quand on clique un rapport archivé (invoiced)", async () => {
    renderInbox(<BackOfficeInboxPanel />);

    fireEvent.click(screen.getByTestId("backoffice-inbox-tab-reports"));
    fireEvent.click(screen.getByTestId("backoffice-reports-archive-toggle"));
    fireEvent.click(screen.getByTestId("backoffice-report-archived-row"));

    expect(await screen.findByTestId("backoffice-inbox-detail")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("backoffice-inbox-detail")).toBeInTheDocument();
    });
  });

  it("garde un rapport validé dans la liste principale tant qu'il n'est pas archivé", () => {
    mockUseBackOffice.mockReturnValue({
      interventions: [validatedNotArchived],
      loading: false,
      error: null,
      firebaseUid: "ivana-uid",
    });

    renderInbox(<BackOfficeInboxPanel />);
    fireEvent.click(screen.getByTestId("backoffice-inbox-tab-reports"));

    expect(screen.queryByTestId("backoffice-reports-archive-section")).not.toBeInTheDocument();
    expect(
      screen.getByTestId("backoffice-inbox-report-row-report-validated-1")
    ).toBeInTheDocument();
  });
});
