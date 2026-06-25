import { screen } from "@testing-library/react";
import { renderWithPager } from "@/test-utils/renderWithPager";
import BillingHubPage from "@/features/billingHub/components/BillingHubPage";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { BillingHubIntentProvider } from "@/context/BillingHubIntentContext";

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({
    activeCompanyId: "demo-local-company",
    isTenantUser: true,
    workspaceReady: true,
  }),
}));

jest.mock("@/features/billingHub/hooks/useCompanyBillingInterventions", () => ({
  useCompanyBillingInterventions: () => ({
    interventions: [
      {
        id: "bill-1",
        status: "done",
        clientName: "Dupont",
        paymentStatus: "unpaid",
        billingLines: [{ quantity: 1, unitPriceCents: 15000 }],
      },
    ],
    loading: false,
    isPreviewCatalog: true,
    hasLiveData: false,
  }),
}));

jest.mock("@/features/billingHub/components/BillingHubAgentPanel", () => ({
  __esModule: true,
  default: () => <div data-testid="billing-hub-agent-panel" />,
}));

jest.mock("@/features/billingHub/components/BillingHubRightPanel", () => ({
  __esModule: true,
  default: () => <div data-testid="billing-hub-right-panel" />,
}));

function renderPage() {
  return renderWithPager(
    <BillingHubIntentProvider>
      <BillingHubPage />
    </BillingHubIntentProvider>,
    BILLING_HUB_SLOT_INDEX + 1
  );
}

describe("BillingHubPage", () => {
  it("renders agent chatbot on the left and billing grid in the center", () => {
    renderPage();
    expect(
      screen.getByTestId(`dashboard-pager-slot-${BILLING_HUB_SLOT_INDEX}`)
    ).toBeInTheDocument();
    expect(screen.getByTestId("billing-hub-center")).toBeInTheDocument();
    expect(screen.getByTestId("billing-hub-chatbot-rail")).toBeInTheDocument();
    expect(screen.getByTestId("billing-hub-agent-panel")).toBeInTheDocument();
  });

  it("renders tabbed right panel on the documents rail", () => {
    renderPage();
    expect(screen.getByTestId("billing-hub-documents-rail")).toBeInTheDocument();
    expect(screen.getByTestId("billing-hub-right-panel")).toBeInTheDocument();
  });
});
