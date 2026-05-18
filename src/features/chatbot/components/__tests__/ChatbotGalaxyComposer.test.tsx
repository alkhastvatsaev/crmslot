import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import ChatbotGalaxyComposer from "@/features/chatbot/components/ChatbotGalaxyComposer";

jest.mock("@/core/ui/GalaxyButton/GalaxyButton", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="galaxy-button-mock">{children}</div>
  ),
}));

jest.mock("@/features/chatbot/ChatbotContext", () => ({
  useChatbotContext: () => ({
    companyId: "demo-co",
    sendMessage: jest.fn(),
    streaming: false,
    pendingTool: null,
  }),
}));

describe("ChatbotGalaxyComposer", () => {
  it("renders input in galaxy dock", () => {
    render(<ChatbotGalaxyComposer />);
    expect(screen.getByTestId("chatbot-galaxy-composer")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-input")).toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-send")).not.toBeInTheDocument();
  });
});
