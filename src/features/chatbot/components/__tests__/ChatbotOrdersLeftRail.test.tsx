import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import ChatbotOrdersLeftRail from "@/features/chatbot/components/ChatbotOrdersLeftRail";

const ensureRightPanelOpen = jest.fn();
const refreshRegistry = jest.fn();

jest.mock("@/features/chatbot/ChatbotContext", () => ({
  useChatbotContext: () => ({
    ensureRightPanelOpen,
    refreshRegistry,
  }),
}));

jest.mock("@/features/chatbot/components/ChatbotSupplierOrdersPanel", () => ({
  __esModule: true,
  default: ({ placement }: { placement?: string }) => (
    <div data-testid="chatbot-orders-panel-mock" data-placement={placement} />
  ),
}));

describe("ChatbotOrdersLeftRail", () => {
  beforeEach(() => {
    ensureRightPanelOpen.mockClear();
    refreshRegistry.mockClear();
  });

  it("renders orders left rail and loads registry", () => {
    render(<ChatbotOrdersLeftRail />);
    expect(screen.getByTestId("chatbot-orders-left-rail")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-orders-panel-mock")).toHaveAttribute(
      "data-placement",
      "leftRail",
    );
    expect(ensureRightPanelOpen).toHaveBeenCalled();
    expect(refreshRegistry).toHaveBeenCalled();
  });
});
