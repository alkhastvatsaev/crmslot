import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import BackOfficeHubPage from "@/features/backoffice/components/BackOfficeHubPage";
import { BACKOFFICE_HUB_SLOT_INDEX } from "@/features/backoffice/backofficeHubConstants";

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({ isTenantUser: true, activeCompanyId: "co-1" }),
}));
jest.mock("@/features/company/isCompanyDispatchViewer", () => ({
  isCompanyDispatchViewer: () => true,
}));
jest.mock("@/features/backoffice/useBackOfficeInterventions", () => ({
  useBackOfficeInterventions: () => ({
    interventions: [
      {
        id: "iv-1",
        companyId: "co-1",
        status: "pending",
        assignedTechnicianUid: "tech-1",
        title: "Test",
        address: "Rue test",
        time: "10:00",
        location: { lat: 0, lng: 0 },
      },
    ],
  }),
}));

const mockInboxIntent = {
  pendingInboxId: null,
  setPendingInboxId: jest.fn(),
  selectedInboxInterventionId: null as string | null,
  setSelectedInboxInterventionId: jest.fn(),
  pendingChatInterventionId: null,
  setPendingChatInterventionId: jest.fn(),
};

jest.mock("@/context/BackofficeInboxIntentContext", () => ({
  useBackofficeInboxIntentOptional: () => mockInboxIntent,
}));

describe("BackOfficeHubPage panels", () => {
  beforeEach(() => {
    mockInboxIntent.selectedInboxInterventionId = null;
  });

  it("shows example content in all panels when no dossier is selected", () => {
    render(<BackOfficeHubPage slotIndex={BACKOFFICE_HUB_SLOT_INDEX} />, { pageCount: 4 });
    expect(screen.getByTestId("backoffice-hub-panel-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("backoffice-hub-example-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("backoffice-hub-example-emails")).toBeInTheDocument();
    expect(screen.getByTestId("backoffice-hub-example-materials")).toBeInTheDocument();
    expect(screen.getByTestId("backoffice-hub-example-billing")).toBeInTheDocument();
    expect(screen.getAllByText(/exemple|sample|voorbeeld/i).length).toBeGreaterThan(0);
  });

  it("renders live timeline when a dossier is selected", () => {
    mockInboxIntent.selectedInboxInterventionId = "iv-1";
    render(<BackOfficeHubPage slotIndex={BACKOFFICE_HUB_SLOT_INDEX} />, { pageCount: 4 });
    expect(screen.getByTestId("intervention-case-timeline")).toBeInTheDocument();
    expect(screen.queryByTestId("backoffice-hub-example-timeline")).not.toBeInTheDocument();
  });
});
