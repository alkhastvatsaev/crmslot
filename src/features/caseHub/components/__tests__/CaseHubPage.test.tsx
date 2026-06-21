import { render, screen } from "@/test-utils/render";
import CaseHubPage from "@/features/caseHub/components/CaseHubPage";
import { CASE_HUB_SLOT_INDEX } from "@/features/caseHub/caseHubConstants";

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({
    activeCompanyId: "co-demo",
    workspaceReady: true,
  }),
}));

jest.mock("@/features/backoffice/useBackOfficeInterventions", () => ({
  useBackOfficeInterventions: () => ({
    interventions: [
      {
        id: "iv-case-1",
        title: "Serrure bloquée",
        address: "Rue Test 1",
        status: "in_progress",
        time: "10:00",
        location: { lat: 0, lng: 0 },
        companyId: "co-demo",
        assignedTechnicianUid: "tech-1",
        createdAt: "2026-06-18T10:00:00.000Z",
      },
    ],
    loading: false,
    error: null,
  }),
}));

jest.mock("@/features/interventions/components/InterventionCaseTimeline", () => ({
  __esModule: true,
  default: () => <div data-testid="case-hub-timeline-mock" />,
}));

jest.mock("@/features/emails/components/InterventionEmailPanel", () => ({
  __esModule: true,
  default: () => <div data-testid="case-hub-emails-mock" />,
}));

describe("CaseHubPage premium patron", () => {
  it("renders situation → choose → act pipeline without draft banner", () => {
    render(<CaseHubPage slotIndex={CASE_HUB_SLOT_INDEX} />, { pageCount: 9 });

    expect(screen.getByTestId("case-hub-page")).toBeInTheDocument();
    expect(screen.queryByTestId("draft-hub-banner")).not.toBeInTheDocument();
    expect(screen.getByTestId("case-hub-overview-panel")).toBeInTheDocument();
    expect(screen.getByTestId("case-hub-choose-panel")).toBeInTheDocument();
    expect(screen.getByTestId("case-hub-right-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("case-hub-kpi-strip")).not.toBeInTheDocument();
    expect(screen.getByTestId("case-hub-left-rail")).toBeInTheDocument();
    expect(screen.getByTestId("case-hub-bucket-in-progress")).toBeInTheDocument();
    expect(screen.getByTestId("case-hub-bucket-to-assign")).toBeInTheDocument();
    expect(screen.getByTestId("case-hub-list")).toBeInTheDocument();
    expect(screen.getByTestId("case-hub-row-iv-case-1")).toBeInTheDocument();
    expect(screen.getByTestId("case-hub-row-action-iv-case-1")).toBeInTheDocument();
    expect(screen.getByTestId("case-hub-detail-summary")).toBeInTheDocument();
    expect(screen.getByTestId("case-hub-section-menu")).toBeInTheDocument();
    expect(screen.getByTestId("case-hub-selected-title")).toBeInTheDocument();
    expect(screen.getByTestId("case-hub-status-in_progress")).toBeInTheDocument();
    expect(screen.getByTestId("case-hub-next-action")).toBeInTheDocument();
    expect(screen.getByTestId("unified-intervention-drawer")).toBeInTheDocument();
  });
});
