import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import { CompanyHubInvoiceTab } from "@/features/company/components/CompanyHubInvoiceTab";
import { RequesterHubProvider } from "@/features/interventions/context/RequesterHubContext";

const openDocumentPreview = jest.fn();
const closeDocumentPreview = jest.fn();

const mockUseRequesterPortalInterventions = jest.fn();

jest.mock("@/features/company/hooks/useRequesterPortalInterventions", () => ({
  useRequesterPortalInterventions: () => mockUseRequesterPortalInterventions(),
}));

jest.mock("@/features/chatbot/ChatbotContext", () => ({
  useChatbotContextOptional: () => ({
    documentPreview: {
      interventionId: "",
      kind: "invoice",
      title: "Facture",
      blobUrl: null,
      loading: false,
      error: null,
      supplierOrderId: null,
      overlayTarget: "right",
    },
    openDocumentPreview,
    closeDocumentPreview,
  }),
}));

function renderTab(interventionId: string | null) {
  return render(
    <RequesterHubProvider>
      <CompanyHubInvoiceTab interventionId={interventionId} />
    </RequesterHubProvider>
  );
}

describe("CompanyHubInvoiceTab", () => {
  beforeEach(() => {
    openDocumentPreview.mockClear();
    closeDocumentPreview.mockClear();
    mockUseRequesterPortalInterventions.mockReturnValue({
      interventions: [],
      loading: false,
    });
  });

  it("shows placeholder when user has no case yet", () => {
    renderTab(null);
    expect(screen.getByTestId("company-hub-invoice-tab")).toBeInTheDocument();
    expect(screen.getByText(/Votre facture apparaîtra ici/i)).toBeInTheDocument();
  });

  it("shows pending state when case exists without billing", () => {
    mockUseRequesterPortalInterventions.mockReturnValue({
      interventions: [
        {
          id: "iv-1",
          status: "pending",
          invoicePdfUrl: null,
          billingLines: [],
          invoiceAmountCents: null,
          createdAt: "2026-06-01T10:00:00.000Z",
        },
      ],
      loading: false,
    });

    renderTab("iv-1");
    expect(screen.getByTestId("company-hub-invoice-pending")).toBeInTheDocument();
    expect(screen.queryByText(/Facture en préparation/i)).not.toBeInTheDocument();
  });

  it("shows view button when invoice is ready", () => {
    mockUseRequesterPortalInterventions.mockReturnValue({
      interventions: [
        {
          id: "iv-2",
          status: "done",
          invoicePdfUrl: null,
          billingLines: [{ description: "Main", quantity: 1, unitPriceCents: 12000 }],
          invoiceAmountCents: 14520,
          createdAt: "2026-06-02T10:00:00.000Z",
        },
      ],
      loading: false,
    });

    renderTab("iv-2");
    fireEvent.click(screen.getByTestId("company-hub-invoice-view-btn"));
    expect(openDocumentPreview).toHaveBeenCalledWith("iv-2", "invoice", false, "right");
    expect(screen.getByTestId("company-hub-invoice-amount")).toHaveTextContent("145,20");
  });

  it("shows storage download link when PDF URL exists", () => {
    mockUseRequesterPortalInterventions.mockReturnValue({
      interventions: [
        {
          id: "iv-3",
          status: "invoiced",
          invoicePdfUrl: "https://storage.example/invoice.pdf",
          billingLines: [],
          invoiceAmountCents: 9900,
          createdAt: "2026-06-03T10:00:00.000Z",
        },
      ],
      loading: false,
    });

    renderTab("iv-3");
    const link = screen.getByTestId("company-hub-invoice-download-link");
    expect(link).toHaveAttribute("href", "https://storage.example/invoice.pdf");
  });
});
