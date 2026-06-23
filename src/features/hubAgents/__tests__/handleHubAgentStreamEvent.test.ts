import { renderHook } from "@testing-library/react";
import { useHubAgentStreamHandler } from "@/features/hubAgents/handleHubAgentStreamEvent";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import type { ChatbotStreamEvent } from "@/features/chatbot";

const mockSetPageIndex = jest.fn();
const mockApplyFocus = jest.fn();
const mockSetFilter = jest.fn();
const mockSetSelectedInterventionId = jest.fn();
const mockSetPendingInboxId = jest.fn();
const mockOpenDocumentPreview = jest.fn();
const mockEnsureRightPanelOpen = jest.fn();
const mockOpenSupplierOrderPdf = jest.fn();
const mockOpenSupplierOrdersPanel = jest.fn();
const mockRefreshRegistry = jest.fn();

jest.mock("@/features/dashboard/dashboardPagerContext", () => ({
  useDashboardPagerOptional: () => ({ setPageIndex: mockSetPageIndex }),
}));

jest.mock("@/context/CompanyStockIntentContext", () => ({
  CRMSLOT_FOCUS_STOCK_HUB_EVENT: "crmslot:focus-stock-hub",
  useCompanyStockIntentOptional: () => ({ applyFocus: mockApplyFocus }),
}));

jest.mock("@/context/BillingHubIntentContext", () => ({
  useBillingHubIntentOptional: () => ({
    setFilter: mockSetFilter,
    setSelectedInterventionId: mockSetSelectedInterventionId,
  }),
}));

jest.mock("@/context/BackofficeInboxIntentContext", () => ({
  useBackofficeInboxIntentOptional: () => ({ setPendingInboxId: mockSetPendingInboxId }),
}));

jest.mock("@/features/chatbot/ChatbotContext", () => ({
  useChatbotContextOptional: () => ({
    openDocumentPreview: mockOpenDocumentPreview,
    ensureRightPanelOpen: mockEnsureRightPanelOpen,
    openSupplierOrderPdf: mockOpenSupplierOrderPdf,
    openSupplierOrdersPanel: mockOpenSupplierOrdersPanel,
    refreshRegistry: mockRefreshRegistry,
  }),
}));

jest.mock("@/features/backoffice/backofficeHubNavigation", () => ({
  navigateBackOfficeHub: jest.fn(),
}));

jest.mock("@/features/crmHistory/crmOrdersChangedEvent", () => ({
  dispatchCrmOrdersChanged: jest.fn(),
}));

function renderHandler(options?: Parameters<typeof useHubAgentStreamHandler>[0]) {
  const { result } = renderHook(() => useHubAgentStreamHandler(options));
  return result.current;
}

describe("useHubAgentStreamHandler", () => {
  beforeEach(() => jest.clearAllMocks());

  it("focus_stock_hub navigates to FEATURE_HUB slot and calls applyFocus", () => {
    const handler = renderHandler();
    const ev: ChatbotStreamEvent = {
      type: "focus_stock_hub",
      companyId: "co-test",
      stockItemId: "sku-1",
      filter: "low",
      searchQuery: "joint",
    };
    handler(ev);
    expect(mockSetPageIndex).toHaveBeenCalledWith(FEATURE_HUB_SLOT_INDEX);
    expect(mockApplyFocus).toHaveBeenCalledWith({
      stockItemId: "sku-1",
      filter: "low",
      searchQuery: "joint",
    });
  });

  it("focus_billing_case sets filter and interventionId", () => {
    const handler = renderHandler();
    const ev: ChatbotStreamEvent = {
      type: "focus_billing_case",
      interventionId: "iv-1",
      filter: "unpaid",
    };
    handler(ev);
    expect(mockSetFilter).toHaveBeenCalledWith("unpaid");
    expect(mockSetSelectedInterventionId).toHaveBeenCalledWith("iv-1");
  });

  it("open_crm_dossier sets pending inbox and navigates", () => {
    const { navigateBackOfficeHub } = jest.requireMock(
      "@/features/backoffice/backofficeHubNavigation"
    ) as {
      navigateBackOfficeHub: jest.Mock;
    };
    const handler = renderHandler();
    handler({ type: "open_crm_dossier", interventionId: "iv-2" });
    expect(mockSetPendingInboxId).toHaveBeenCalledWith("iv-2");
    expect(navigateBackOfficeHub).toHaveBeenCalled();
  });

  it("document_preview opens chatbot overlay on material page by default", () => {
    const handler = renderHandler();
    handler({ type: "document_preview", interventionId: "iv-3", documentType: "invoice" });
    expect(mockOpenDocumentPreview).toHaveBeenCalledWith("iv-3", "invoice", true, "materialRight");
  });

  it("document_preview navigates to billing page when billingDocumentOnBillingPage=true", () => {
    const handler = renderHandler({ billingDocumentOnBillingPage: true });
    handler({ type: "document_preview", interventionId: "iv-3", documentType: "invoice" });
    expect(mockSetPageIndex).toHaveBeenCalledWith(BILLING_HUB_SLOT_INDEX);
    expect(mockOpenDocumentPreview).toHaveBeenCalledWith("iv-3", "invoice", true, "right");
  });

  it("supplier_order_pdf opens right panel and calls openSupplierOrderPdf", () => {
    const handler = renderHandler();
    handler({ type: "supplier_order_pdf", companyId: "co-test", orderId: "so-1" });
    expect(mockEnsureRightPanelOpen).toHaveBeenCalled();
    expect(mockOpenSupplierOrderPdf).toHaveBeenCalledWith("co-test", "so-1", true, "materialRight");
  });

  it("supplier_orders_panel opens panel and dispatches CRM event", () => {
    const { dispatchCrmOrdersChanged } = jest.requireMock(
      "@/features/crmHistory/crmOrdersChangedEvent"
    ) as {
      dispatchCrmOrdersChanged: jest.Mock;
    };
    const handler = renderHandler({ companyId: "co-test" });
    handler({ type: "supplier_orders_panel", highlightOrderId: "so-2" });
    expect(mockOpenSupplierOrdersPanel).toHaveBeenCalledWith("so-2", null, undefined);
    expect(mockEnsureRightPanelOpen).toHaveBeenCalled();
    expect(dispatchCrmOrdersChanged).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: "co-test", supplierOrderId: "so-2" })
    );
  });

  it("registry_refresh calls chatbot refreshRegistry", () => {
    const handler = renderHandler({ companyId: "co-test" });
    handler({ type: "registry_refresh" });
    expect(mockRefreshRegistry).toHaveBeenCalled();
  });

  it("ignores unknown event types without throwing", () => {
    const handler = renderHandler();
    expect(() => handler({ type: "text", delta: "hello" })).not.toThrow();
    expect(mockSetPageIndex).not.toHaveBeenCalled();
  });
});
