import { render, screen, fireEvent } from "@/test-utils/render";
import CommissionsHubPage from "@/features/commissionsHub/components/CommissionsHubPage";
import { COMMISSIONS_HUB_SLOT_INDEX } from "@/features/commissionsHub/commissionsHubConstants";

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({
    activeCompanyId: "co-demo",
    isTenantUser: true,
    workspaceReady: true,
  }),
}));

jest.mock("@/features/commissionsHub/hooks/useCommissionsHubData", () => ({
  useCommissionsHubData: () => ({
    rules: [
      {
        id: "rule-1",
        companyId: "co-demo",
        isActive: true,
        level: "group",
        targetId: "co-demo",
        valueType: "percentage",
        value: 12,
        createdAt: "",
        updatedAt: "",
        createdByUid: "u1",
      },
    ],
    interventions: [
      {
        id: "iv-1",
        title: "Job",
        address: "Rue 1",
        time: "10:00",
        status: "invoiced",
        location: { lat: 0, lng: 0 },
        assignedTechnicianUid: "tech-a",
        commissionAmountCents: 5000,
        invoicedAt: "2026-06-10T10:00:00.000Z",
      },
    ],
    manualEntries: [],
    rulesLoading: false,
    interventionsLoading: false,
    manualLoading: false,
    saving: false,
    saveRule: jest.fn().mockResolvedValue(true),
    removeRule: jest.fn().mockResolvedValue(undefined),
    saveManualEntry: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock("@/features/technicians/hooks", () => ({
  useTechnicians: () => ({
    technicians: [
      {
        id: "t1",
        name: "Alex",
        initial: "A",
        authUid: "tech-a",
        status: "available",
        location: { lat: 0, lng: 0 },
      },
    ],
    loading: false,
  }),
}));

describe("CommissionsHubPage premium patron", () => {
  it("shows KPI strip, company rule hero and team grid by default", () => {
    render(<CommissionsHubPage slotIndex={COMMISSIONS_HUB_SLOT_INDEX} />, { pageCount: 9 });

    expect(screen.getByTestId("commissions-hub-kpi-strip")).toBeInTheDocument();
    expect(screen.getByTestId("commissions-hub-kpi-total")).toBeInTheDocument();
    expect(screen.getByTestId("commissions-hub-company-rule-hero")).toBeInTheDocument();
    expect(screen.getByTestId("commissions-hub-team-grid")).toBeInTheDocument();
    expect(screen.getByTestId("commissions-hub-tech-tech-a")).toBeInTheDocument();
  });

  it("opens technician detail panel on click", () => {
    render(<CommissionsHubPage slotIndex={COMMISSIONS_HUB_SLOT_INDEX} />, { pageCount: 9 });

    fireEvent.click(screen.getByTestId("commissions-hub-tech-tech-a"));
    expect(screen.getByTestId("commissions-hub-right-technician")).toBeInTheDocument();
    expect(screen.getByTestId("commissions-hub-tech-bonus")).toBeInTheDocument();
  });

  it("switches to rules grid from view chips", () => {
    render(<CommissionsHubPage slotIndex={COMMISSIONS_HUB_SLOT_INDEX} />, { pageCount: 9 });

    fireEvent.click(screen.getByTestId("commissions-hub-mode-rules"));
    expect(screen.getByTestId("commissions-hub-rules-grid")).toBeInTheDocument();
    expect(screen.getByTestId("commissions-hub-rule-rule-1")).toBeInTheDocument();
  });
  it("opens manual bonus form without switching center to rules", () => {
    render(<CommissionsHubPage slotIndex={COMMISSIONS_HUB_SLOT_INDEX} />, { pageCount: 9 });

    fireEvent.click(screen.getByTestId("commissions-hub-tech-tech-a"));
    fireEvent.click(screen.getByTestId("commissions-hub-tech-bonus"));

    expect(screen.getByTestId("commissions-hub-team-grid")).toBeInTheDocument();
    expect(screen.getByTestId("commissions-hub-right-manual")).toBeInTheDocument();
    expect(screen.queryByTestId("commissions-hub-rules-grid")).not.toBeInTheDocument();
  });
});
