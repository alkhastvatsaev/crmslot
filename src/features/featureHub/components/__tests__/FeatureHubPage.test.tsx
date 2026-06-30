import { screen } from "@testing-library/react";
import { renderWithDesktopPager, renderWithPager } from "@/test-utils/renderWithPager";
import FeatureHubPage from "@/features/featureHub/components/FeatureHubPage";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { CompanyStockAgentBridgeProvider } from "@/context/CompanyStockAgentBridgeContext";
import { CompanyStockIntentProvider } from "@/context/CompanyStockIntentContext";

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({
    activeCompanyId: "demo-local-company",
    isTenantUser: true,
    workspaceReady: true,
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
  }),
}));

jest.mock("@/features/chatbot/ChatbotContext", () => ({
  useChatbotContextOptional: () => null,
  useChatbotContext: () => ({
    ensureRightPanelOpen: jest.fn(),
    refreshRegistry: jest.fn(),
    supplierOrdersPanel: { open: true, highlightOrderId: null, highlightMaterialOrderId: null },
    supplierOrders: [],
    materialOrders: [],
    registryError: null,
    closeSupplierOrdersPanel: jest.fn(),
    companyId: "demo-local-company",
    openSupplierOrderPdf: jest.fn(),
    openDocumentPreview: jest.fn(),
    documentPreview: {
      interventionId: "",
      kind: "material_order",
      title: "",
      blobUrl: null,
      loading: false,
      error: null,
      supplierOrderId: null,
      overlayTarget: null,
    },
    closeDocumentPreview: jest.fn(),
    chatbotInvoices: [],
    workspaceSnapshot: null,
  }),
}));

jest.mock("@/features/featureHub/hooks/useCompanySupplierOrdersRecent", () => ({
  useCompanySupplierOrdersRecent: () => ({ orders: [], loading: false }),
}));

jest.mock("@/features/backoffice/useBackOfficeInterventions", () => ({
  useBackOfficeInterventions: () => ({ interventions: [], loading: false, error: null }),
}));

describe("FeatureHubPage", () => {
  it("renders agent, center inventory, and Commandes panel on the right", () => {
    renderWithPager(
      <CompanyStockAgentBridgeProvider>
        <CompanyStockIntentProvider>
          <FeatureHubPage />
        </CompanyStockIntentProvider>
      </CompanyStockAgentBridgeProvider>,
      FEATURE_HUB_SLOT_INDEX + 1
    );
    const slot = `dashboard-pager-slot-${FEATURE_HUB_SLOT_INDEX}`;
    expect(screen.getByTestId(slot)).toBeInTheDocument();
    expect(screen.getByTestId("company-stock-agent-panel")).toBeInTheDocument();
    expect(screen.getByTestId(`${slot}-panel-right`)).toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-left-rail")).not.toBeInTheDocument();
    expect(screen.getByTestId("company-stock-orders-right-rail")).toBeInTheDocument();
    expect(screen.getByTestId("company-stock-orders-panel")).toBeInTheDocument();
    expect(screen.queryByText("Commandes")).not.toBeInTheDocument();
    expect(screen.getByTestId("company-stock-center")).toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-pulse")).not.toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-filter-bar")).not.toBeInTheDocument();
    expect(screen.getByTestId("company-stock-list")).toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-search")).not.toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-autopilot-primary")).not.toBeInTheDocument();
  });
  it("renders desktop triple grid with stock grid in center panel", () => {
    const { container } = renderWithDesktopPager(
      <CompanyStockAgentBridgeProvider>
        <CompanyStockIntentProvider>
          <FeatureHubPage />
        </CompanyStockIntentProvider>
      </CompanyStockAgentBridgeProvider>,
      FEATURE_HUB_SLOT_INDEX + 1,
      { initialPageIndex: FEATURE_HUB_SLOT_INDEX }
    );

    expect(container.querySelector(".dashboard-desktop-grid")).toBeInTheDocument();
    expect(screen.getByTestId("company-stock-list")).toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-lecot-catalog")).not.toBeInTheDocument();
    expect(
      screen.getByTestId(`dashboard-pager-slot-${FEATURE_HUB_SLOT_INDEX}-panel-left`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`dashboard-pager-slot-${FEATURE_HUB_SLOT_INDEX}-panel-center`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`dashboard-pager-slot-${FEATURE_HUB_SLOT_INDEX}-panel-right`)
    ).toBeInTheDocument();
  });
});
