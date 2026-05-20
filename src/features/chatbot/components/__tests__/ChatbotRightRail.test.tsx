import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import ChatbotRightRail from "@/features/chatbot/components/ChatbotRightRail";

const ensureRightPanelOpen = jest.fn();

jest.mock("@/features/chatbot/ChatbotContext", () => ({
  useChatbotContext: () => ({
    ensureRightPanelOpen,
    documentPreview: {
      blobUrl: null,
      loading: false,
      error: null,
      kind: "quote",
      title: "",
      interventionId: "",
    },
  }),
}));

jest.mock("@/features/chatbot/components/ChatbotDocumentsRightPanel", () => ({
  __esModule: true,
  default: () => <div data-testid="chatbot-documents-right-panel" />,
}));

describe("ChatbotRightRail", () => {
  beforeEach(() => {
    ensureRightPanelOpen.mockClear();
  });

  it("renders documents list and preview panel without tabs", () => {
    render(<ChatbotRightRail />);
    expect(screen.getByTestId("chatbot-right-rail")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-documents-right-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-right-rail-tabs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-right-tab-purchase-order")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-right-tab-invoices")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-invoices-panel")).not.toBeInTheDocument();
  });

  it("ensures the preview panel is open on mount", () => {
    render(<ChatbotRightRail />);
    expect(ensureRightPanelOpen).toHaveBeenCalled();
  });
});
