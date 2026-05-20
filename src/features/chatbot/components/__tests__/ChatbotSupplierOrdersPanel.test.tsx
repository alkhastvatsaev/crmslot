import { fireEvent, screen, within } from "@testing-library/react";
import { render } from "@/test-utils/render";
import ChatbotSupplierOrdersPanel from "@/features/chatbot/components/ChatbotSupplierOrdersPanel";

jest.mock("@/features/chatbot/ChatbotContext", () => ({
  useChatbotContext: () => ({
    supplierOrdersPanel: {
      open: true,
      highlightOrderId: "ord-1",
      highlightMaterialOrderId: null,
    },
    supplierOrders: [
      {
        id: "ord-1",
        companyId: "co-1",
        supplierId: "lecot",
        supplierName: "Lecot",
        status: "sent",
        isDemo: true,
        lines: [{ sku: "A1", label: "Cylindre", quantity: 2, unitPriceCents: 5000 }],
        totalCents: 10000,
        createdAt: "2026-05-18T10:00:00.000Z",
        updatedAt: "2026-05-18T10:00:00.000Z",
      },
    ],
    materialOrders: [],
    closeSupplierOrdersPanel: jest.fn(),
    companyId: "co-1",
    openSupplierOrderPdf: jest.fn(),
    openDocumentPreview: jest.fn(),
    ensureRightPanelOpen: jest.fn(),
    documentPreview: {
      interventionId: "",
      kind: "material_order",
      title: "Bon de commande",
      blobUrl: null,
      loading: false,
      error: null,
      supplierOrderId: null,
      overlayTarget: null,
    },
    closeDocumentPreview: jest.fn(),
  }),
}));

describe("ChatbotSupplierOrdersPanel", () => {
  it("renders supplier orders list", () => {
    render(<ChatbotSupplierOrdersPanel />);
    expect(screen.getByTestId("chatbot-supplier-orders-panel")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-supplier-order-ord-1")).toBeInTheDocument();
    expect(screen.getByText(/Cylindre/)).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-supplier-order-pdf-ord-1")).toBeInTheDocument();
  });

  it("shows demo progress on left rail for isDemo orders", () => {
    render(<ChatbotSupplierOrdersPanel placement="leftRail" />);
    expect(screen.getByTestId("chatbot-orders-left-panel")).toBeInTheDocument();
    const progress = screen.getByTestId("chatbot-supplier-order-demo-progress-ord-1");
    expect(progress).toBeInTheDocument();
    expect(within(progress).getByText("Préparation")).toBeInTheDocument();
  });

  it("opens supplier pdf on left overlay without switching to right panel", () => {
    const openSupplierOrderPdf = jest.fn();
    jest.spyOn(require("@/features/chatbot/ChatbotContext"), "useChatbotContext").mockReturnValue({
      supplierOrdersPanel: { open: true, highlightOrderId: "ord-1", highlightMaterialOrderId: null },
      supplierOrders: [
        {
          id: "ord-1",
          companyId: "co-1",
          supplierId: "lecot",
          supplierName: "Lecot",
          status: "sent",
          isDemo: false,
          lines: [{ sku: "A1", label: "Cylindre", quantity: 1, unitPriceCents: 5000 }],
          totalCents: 5000,
          createdAt: "2026-05-18T10:00:00.000Z",
          updatedAt: "2026-05-18T10:00:00.000Z",
        },
      ],
      materialOrders: [],
      companyId: "co-1",
      registryError: null,
      closeSupplierOrdersPanel: jest.fn(),
      openSupplierOrderPdf,
      openDocumentPreview: jest.fn(),
      ensureRightPanelOpen: jest.fn(),
      documentPreview: {
        interventionId: "",
        kind: "material_order",
        title: "Bon de commande fournisseur",
        blobUrl: "blob:mock",
        loading: false,
        error: null,
        supplierOrderId: "ord-1",
        overlayTarget: "left",
      },
      closeDocumentPreview: jest.fn(),
      refreshRegistry: jest.fn(),
    });
    render(<ChatbotSupplierOrdersPanel placement="leftRail" />);
    fireEvent.click(screen.getByTestId("chatbot-supplier-order-pdf-ord-1"));
    expect(openSupplierOrderPdf).toHaveBeenCalledWith("co-1", "ord-1", false, "left");
    expect(screen.getByTestId("chatbot-orders-preview-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-orders-preview-iframe")).toBeInTheDocument();
  });

  it("closes left overlay on close button", () => {
    const closeDocumentPreview = jest.fn();
    jest.spyOn(require("@/features/chatbot/ChatbotContext"), "useChatbotContext").mockReturnValue({
      supplierOrdersPanel: { open: true, highlightOrderId: "ord-1", highlightMaterialOrderId: null },
      supplierOrders: [
        {
          id: "ord-1",
          companyId: "co-1",
          supplierId: "lecot",
          supplierName: "Lecot",
          status: "sent",
          isDemo: true,
          lines: [{ sku: "A1", label: "Cylindre", quantity: 1, unitPriceCents: 5000 }],
          totalCents: 5000,
          createdAt: "2026-05-18T10:00:00.000Z",
          updatedAt: "2026-05-18T10:00:00.000Z",
        },
      ],
      materialOrders: [],
      companyId: "co-1",
      registryError: null,
      closeSupplierOrdersPanel: jest.fn(),
      openSupplierOrderPdf: jest.fn(),
      openDocumentPreview: jest.fn(),
      ensureRightPanelOpen: jest.fn(),
      documentPreview: {
        interventionId: "",
        kind: "material_order",
        title: "Bon",
        blobUrl: "blob:x",
        loading: false,
        error: null,
        supplierOrderId: "ord-1",
        overlayTarget: "left",
      },
      closeDocumentPreview,
      refreshRegistry: jest.fn(),
    });
    render(<ChatbotSupplierOrdersPanel placement="leftRail" />);
    fireEvent.click(screen.getByTestId("chatbot-orders-preview-close"));
    expect(closeDocumentPreview).toHaveBeenCalledTimes(1);
  });

  it("closes panel", () => {
    const close = jest.fn();
    jest.spyOn(require("@/features/chatbot/ChatbotContext"), "useChatbotContext").mockReturnValue({
      supplierOrdersPanel: { open: true, highlightOrderId: null, highlightMaterialOrderId: null },
      supplierOrders: [],
      materialOrders: [],
      closeSupplierOrdersPanel: close,
    });
    render(<ChatbotSupplierOrdersPanel />);
    fireEvent.click(screen.getByTestId("chatbot-supplier-orders-close"));
    expect(close).toHaveBeenCalled();
  });
});
