import { screen, fireEvent } from "@testing-library/react";
import { renderWithPager } from "@/test-utils/renderWithPager";
import CrmHistoryPage from "@/features/crmHistory/components/CrmHistoryPage";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({
    activeCompanyId: "demo-local-company",
    isTenantUser: true,
    firebaseUid: "uid-test",
    workspaceReady: true,
  }),
}));

jest.mock("@/features/backoffice/useBackOfficeInterventions", () => ({
  useBackOfficeInterventions: () => ({ interventions: [], loading: false, error: null }),
}));

jest.mock("@/features/featureHub/hooks/useCompanyMaterialOrdersRecent", () => ({
  useCompanyMaterialOrdersRecent: () => ({
    orders: [],
    loading: false,
    isPreviewOrders: false,
    dismissDemoOrder: jest.fn(),
  }),
}));

jest.mock("@/features/featureHub/hooks/useCompanySupplierOrdersRecent", () => ({
  useCompanySupplierOrdersRecent: () => ({ orders: [], loading: false, error: null }),
}));

jest.mock("@/features/crmHistory/hooks/useCompanyEmailsFeed", () => ({
  useCompanyEmailsFeed: () => ({ emails: [], loading: false }),
}));

jest.mock("@/features/crmHistory/hooks/useCompanyCommissionsFeed", () => ({
  useCompanyCommissionsFeed: () => ({ rows: [], loading: false }),
}));

jest.mock("@/features/crmHistory/hooks/useCompanyStatusEventsFeed", () => ({
  useCompanyStatusEventsFeed: () => ({ events: [], loading: false, error: null }),
}));

jest.mock("@/features/crmHistory/hooks/useCompanyCrmActivityLog", () => ({
  useCompanyCrmActivityLog: () => ({ rows: [], loading: false }),
}));

jest.mock("@/features/crmHistory/hooks/useCompanyIvanaChatFeed", () => ({
  useCompanyIvanaChatFeed: () => ({ messages: [], loading: false }),
}));

jest.mock("@/context/CrmHistoryAgentBridgeContext", () => ({
  useCrmHistoryAgentBridgeOptional: () => null,
}));

jest.mock("@/features/crmHistory/hooks/useCrmHistoryAgent", () => ({
  useCrmHistoryAgent: () => ({
    messages: [],
    thinking: false,
    sendMessage: jest.fn(),
    resetConversation: jest.fn(),
    enabled: false,
  }),
}));

const mockUseCrmActivityFeed = jest.fn((..._args: unknown[]) => ({
  events: [
    {
      id: "feed-e1",
      type: "intervention_created",
      ts: Date.now(),
      interventionId: "iv-feed",
      interventionTitle: "Test dossier",
      clientName: "Client test",
    },
  ],
  loading: false,
  refreshing: false,
  feedError: null,
}));

jest.mock("@/features/crmHistory/hooks/useCrmActivityFeed", () => ({
  useCrmActivityFeed: (...args: unknown[]) => mockUseCrmActivityFeed(...args),
}));

const mockSetPendingInboxId = jest.fn();
jest.mock("@/context/BackofficeInboxIntentContext", () => ({
  useBackofficeInboxIntentOptional: () => ({
    pendingInboxId: null,
    setPendingInboxId: mockSetPendingInboxId,
    selectedInboxInterventionId: null,
    setSelectedInboxInterventionId: jest.fn(),
    pendingChatInterventionId: null,
    setPendingChatInterventionId: jest.fn(),
  }),
}));

jest.mock("@/context/DateContext", () => ({
  useDateContext: () => ({ selectedDate: new Date("2026-06-06") }),
}));

jest.mock("@/features/backoffice/backofficeHubNavigation", () => ({
  navigateBackOfficeHub: jest.fn(),
  BACKOFFICE_HUB_ANCHOR_DUPLICATES: "backoffice-hub-duplicates",
  BACKOFFICE_HUB_ANCHOR_DASHBOARD: "backoffice-hub-dashboard",
  BACKOFFICE_HUB_ANCHOR_CALENDAR: "backoffice-hub-calendar",
}));

function renderCrmPage() {
  return renderWithPager(<CrmHistoryPage />, CRM_HISTORY_SLOT_INDEX + 1, {
    initialPageIndex: CRM_HISTORY_SLOT_INDEX,
  });
}

describe("CrmHistoryPage", () => {
  beforeEach(() => {
    mockSetPendingInboxId.mockClear();
    mockUseCrmActivityFeed.mockClear();
  });

  it("filtre le feed sur la date du calendrier (panel haut gauche)", () => {
    const calendarDate = new Date("2026-06-06");
    renderCrmPage();
    expect(mockUseCrmActivityFeed).toHaveBeenCalledWith(
      "demo-local-company",
      "all",
      "all",
      "",
      calendarDate
    );
  });

  it("renders history agent left rail and center feed", () => {
    renderCrmPage();
    const slot = `dashboard-pager-slot-${CRM_HISTORY_SLOT_INDEX}`;
    expect(screen.getByTestId(slot)).toBeInTheDocument();
    expect(screen.getByTestId(`${slot}-panel-left`)).toBeInTheDocument();
    expect(screen.getByTestId(`${slot}-panel-right`)).toBeInTheDocument();
    expect(screen.getByTestId(`${slot}-panel-center`)).toBeInTheDocument();
    expect(screen.getByTestId("crm-history-agent-panel")).toBeInTheDocument();
    expect(screen.getByTestId("crm-center-feed")).toBeInTheDocument();
    expect(screen.getByTestId("crm-history-detail-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("crm-search-input")).not.toBeInTheDocument();
  });

  it("shows event detail in center panel when a feed card is selected", () => {
    renderCrmPage();
    fireEvent.click(screen.getByTestId("crm-event-feed-e1"));
    const panel = screen.getByTestId("crm-history-detail-panel");
    expect(panel).toBeInTheDocument();
    expect(screen.getByTestId("crm-history-detail-body")).toHaveTextContent(/Client test/);
  });
});
