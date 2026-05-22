import { screen } from "@testing-library/react";
import { renderWithPager } from "@/test-utils/renderWithPager";
import FeatureHubPage from "@/features/featureHub/components/FeatureHubPage";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { CompanyStockAgentBridgeProvider } from "@/context/CompanyStockAgentBridgeContext";
import { CompanyStockIntentProvider } from "@/context/CompanyStockIntentContext";

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({
    activeCompanyId: "demo-local-company",
    isTenantUser: true,
    firebaseUid: "uid-test",
    activeRole: "admin",
    memberships: [{ companyId: "demo-local-company", companyName: "Demo" }],
  }),
}));

jest.mock("@/features/featureHub/hooks/useCompanyStockItems", () => ({
  useCompanyStockItems: () => ({
    items: [
      {
        id: "stock-1",
        companyId: "demo-local-company",
        reference: "REF-A",
        description: "Gâche électrique",
        quantity: 1,
        alertThreshold: 3,
        unit: "pcs",
        updatedAt: "2026-05-01",
      },
    ],
    loading: false,
    isPreviewCatalog: false,
    hasLiveStock: true,
  }),
}));

jest.mock("@/features/featureHub/hooks/useCompanyMaterialOrdersRecent", () => ({
  useCompanyMaterialOrdersRecent: () => ({
    orders: [
      {
        id: "demo-mo-1",
        companyId: "demo-local-company",
        interventionId: "INT-24051",
        technicianUid: "demo-tech-local",
        partsRequested: [{ description: "Cylindre européen 80 mm", quantity: 2 }],
        urgency: "normal",
        status: "pending",
        createdAt: "2026-05-21T12:00:00.000Z",
        updatedAt: "2026-05-21T12:00:00.000Z",
      },
    ],
    loading: false,
    dismissDemoOrder: jest.fn(),
  }),
}));

jest.mock("@/features/featureHub/hooks/useCompanySupplierOrdersRecent", () => ({
  useCompanySupplierOrdersRecent: () => ({ orders: [], loading: false }),
}));

jest.mock("@/features/backoffice/useBackOfficeInterventions", () => ({
  useBackOfficeInterventions: () => ({ interventions: [], loading: false, error: null }),
}));

describe("FeatureHubPage", () => {
  it("renders agent, center inventory, and orders track on the right", () => {
    renderWithPager(
      <CompanyStockAgentBridgeProvider>
        <CompanyStockIntentProvider>
          <FeatureHubPage />
        </CompanyStockIntentProvider>
      </CompanyStockAgentBridgeProvider>,
      FEATURE_HUB_SLOT_INDEX + 1,
    );
    const slot = `dashboard-pager-slot-${FEATURE_HUB_SLOT_INDEX}`;
    expect(screen.getByTestId(slot)).toBeInTheDocument();
    expect(screen.getByTestId("company-stock-agent-panel")).toBeInTheDocument();
    expect(screen.getByTestId(`${slot}-panel-right`)).toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-left-rail")).not.toBeInTheDocument();
    expect(screen.getByTestId("company-stock-orders-track")).toBeInTheDocument();
    expect(screen.getByText("Suivi commandes")).toBeInTheDocument();
    expect(screen.getByTestId("company-stock-center")).toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-pulse")).not.toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-filter-bar")).not.toBeInTheDocument();
    expect(screen.getByTestId("company-stock-list")).toBeInTheDocument();
    expect(screen.getByTestId("company-stock-search")).toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-autopilot-primary")).not.toBeInTheDocument();
  });
});
