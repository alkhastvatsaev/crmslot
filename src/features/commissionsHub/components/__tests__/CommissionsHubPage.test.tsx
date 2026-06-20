import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import CommissionsHubPage from "@/features/commissionsHub/components/CommissionsHubPage";
import { COMMISSIONS_HUB_SLOT_INDEX } from "@/features/commissionsHub/commissionsHubConstants";

const saveTechnicianRate = jest.fn().mockResolvedValue(true);

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
        id: "rule-group",
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
    saveTechnicianRate,
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
  beforeEach(() => {
    saveTechnicianRate.mockClear();
  });

  it("renders revenue, distribution and rates panels", () => {
    render(<CommissionsHubPage slotIndex={COMMISSIONS_HUB_SLOT_INDEX} />, { pageCount: 9 });

    expect(screen.getByTestId("commissions-hub-page")).toBeInTheDocument();
    expect(screen.getByTestId("commissions-hub-kpi-revenue")).toBeInTheDocument();
    expect(screen.getByTestId("commissions-hub-team-grid")).toBeInTheDocument();
    expect(screen.getByTestId("commissions-hub-tech-rates")).toBeInTheDocument();
    expect(screen.getByTestId("commissions-hub-tech-tech-a")).toBeInTheDocument();
  });

  it("highlights technician in right panel after center selection", () => {
    render(<CommissionsHubPage slotIndex={COMMISSIONS_HUB_SLOT_INDEX} />, { pageCount: 9 });

    fireEvent.click(screen.getByTestId("commissions-hub-tech-tech-a"));
    expect(screen.getByTestId("commissions-hub-right-technician")).toBeInTheDocument();
    expect(screen.getByTestId("commissions-hub-tech-rate-row-tech-a")).toBeInTheDocument();
  });

  it("persists a technician rate change through saveTechnicianRate", async () => {
    render(<CommissionsHubPage slotIndex={COMMISSIONS_HUB_SLOT_INDEX} />, { pageCount: 9 });

    fireEvent.click(screen.getByTestId("commissions-hub-tech-rate-plus-tech-a"));

    await waitFor(() => expect(saveTechnicianRate).toHaveBeenCalledTimes(1));
    expect(saveTechnicianRate).toHaveBeenCalledWith({
      technicianUid: "tech-a",
      alternateTargetIds: ["t1"],
      valueType: "percentage",
      value: 13,
    });
  });
});
