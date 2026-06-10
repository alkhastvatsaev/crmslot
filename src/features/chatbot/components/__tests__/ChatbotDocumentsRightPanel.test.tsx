import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import ChatbotDocumentsRightPanel from "@/features/chatbot/components/ChatbotDocumentsRightPanel";

const openDocumentPreview = jest.fn();
const openSupplierOrderPdf = jest.fn();
const closeDocumentPreview = jest.fn();

jest.mock("@/features/backoffice/useBackOfficeInterventions", () => ({
  useBackOfficeInterventions: () => ({
    interventions: [],
    loading: false,
    error: null,
    firebaseUid: null,
  }),
}));

jest.mock("@/features/chatbot/hooks/useChatbotDocumentTileThumbnails", () => ({
  useChatbotDocumentTileThumbnails: () => ({
    thumbnails: {
      "invoice:iv-1": { thumbnailUrl: "data:image/jpeg;base64,mock-inv" },
      "supplier:ord-1": { thumbnailUrl: "data:image/jpeg;base64,mock-ord" },
    },
    thumbnailLoading: {},
  }),
  invoiceTileKey: (id: string) => `invoice:${id}`,
  supplierTileKey: (id: string) => `supplier:${id}`,
}));

jest.mock("@/features/chatbot/ChatbotContext", () => ({
  useChatbotContext: () => ({
    companyId: "co-1",
    chatbotInvoices: [
      {
        interventionId: "iv-1",
        clientLabel: "Dupont",
        status: "invoiced",
        totalCents: 12000,
        invoicedAt: "2026-05-18T10:00:00.000Z",
        problem: "Serrure",
      },
    ],
    chatbotInvoicesLoading: false,
    supplierOrders: [
      {
        id: "ord-1",
        companyId: "co-1",
        supplierId: "lecot",
        supplierName: "Lecot",
        status: "sent",
        clientName: "Martin",
        lines: [{ sku: "A1", label: "Cylindre", quantity: 1, unitPriceCents: 5000 }],
        totalCents: 5000,
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
        isDemo: true,
      },
    ],
    materialOrders: [],
    workspaceSnapshot: null,
    documentPreview: {
      interventionId: "",
      kind: "material_order",
      title: "Bon de commande fournisseur",
      blobUrl: "blob:mock",
      loading: false,
      error: null,
      supplierOrderId: "ord-1",
      overlayTarget: "right",
    },
    openDocumentPreview,
    openSupplierOrderPdf,
    closeDocumentPreview,
  }),
}));

describe("ChatbotDocumentsRightPanel", () => {
  beforeEach(() => {
    openDocumentPreview.mockClear();
    openSupplierOrderPdf.mockClear();
    closeDocumentPreview.mockClear();
  });

  it("renders documents in one chronological grid (2 columns)", () => {
    render(<ChatbotDocumentsRightPanel />);
    expect(screen.getByTestId("chatbot-documents-right-panel")).toBeInTheDocument();
    const grid = screen.getByTestId("chatbot-documents-grid");
    expect(grid).toHaveClass("grid-cols-2");
    expect(screen.queryByTestId("chatbot-documents-grid-invoices")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-documents-grid-orders")).not.toBeInTheDocument();
    const tiles = Array.from(grid.children);
    expect(tiles[0]).toContainElement(screen.getByTestId("chatbot-document-order-ord-1"));
    expect(tiles[1]).toContainElement(screen.getByTestId("chatbot-document-invoice-iv-1"));
    expect(screen.getByTestId("chatbot-document-invoice-iv-1")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-document-order-ord-1")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-document-invoice-iv-1-preview")).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,mock-inv"
    );
    expect(screen.getByTestId("chatbot-document-order-ord-1-preview")).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,mock-ord"
    );
    expect(screen.getByText(/Dupont/)).toBeInTheDocument();
    expect(screen.getByText(/Martin/)).toBeInTheDocument();
    expect(screen.getByText(/Serrure/)).toBeInTheDocument();
    expect(screen.getByText(/Cylindre/)).toBeInTheDocument();
  });

  it("opens invoice pdf on tile click", () => {
    render(<ChatbotDocumentsRightPanel />);
    fireEvent.click(screen.getByTestId("chatbot-document-invoice-iv-1"));
    expect(openDocumentPreview).toHaveBeenCalledWith("iv-1", "invoice");
  });

  it("opens supplier order pdf on tile click", () => {
    render(<ChatbotDocumentsRightPanel />);
    fireEvent.click(screen.getByTestId("chatbot-document-order-ord-1"));
    expect(openSupplierOrderPdf).toHaveBeenCalledWith("co-1", "ord-1");
  });

  it("shows pdf overlay on top of list when preview is open", () => {
    render(<ChatbotDocumentsRightPanel />);
    expect(screen.getByTestId("chatbot-documents-preview-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-documents-preview-iframe")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-documents-list")).toBeInTheDocument();
  });

  it("closes overlay when user clicks close button", () => {
    render(<ChatbotDocumentsRightPanel />);
    fireEvent.click(screen.getByTestId("chatbot-documents-preview-close"));
    expect(closeDocumentPreview).toHaveBeenCalledTimes(1);
  });

  it("filters documents with smart search", () => {
    render(<ChatbotDocumentsRightPanel />);
    const search = screen.getByTestId("chatbot-documents-search").querySelector("input");
    expect(search).toBeTruthy();
    fireEvent.change(search!, { target: { value: "facture dupont" } });
    expect(screen.getByTestId("chatbot-document-invoice-iv-1")).toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-document-order-ord-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("chatbot-documents-count")).toHaveTextContent("1/2");
  });

  it("shows no-results state when search matches nothing", () => {
    render(<ChatbotDocumentsRightPanel />);
    const search = screen.getByTestId("chatbot-documents-search").querySelector("input");
    fireEvent.change(search!, { target: { value: "zzz inexistant" } });
    expect(screen.getByTestId("chatbot-documents-no-results")).toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-document-invoice-iv-1")).not.toBeInTheDocument();
  });
});
