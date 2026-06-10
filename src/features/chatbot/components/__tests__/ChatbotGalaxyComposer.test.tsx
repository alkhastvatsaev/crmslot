import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import ChatbotGalaxyComposer from "@/features/chatbot/components/ChatbotGalaxyComposer";

const sendMessage = jest.fn();

jest.mock("@/core/ui/GalaxyButton/GalaxyButton", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="galaxy-button-mock">{children}</div>
  ),
}));

jest.mock("@/features/chatbot/ChatbotContext", () => ({
  useChatbotContext: () => ({
    companyId: "demo-co",
    sendMessage,
    streaming: false,
    pendingTool: null,
    newConversation: jest.fn(),
  }),
}));

describe("ChatbotGalaxyComposer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders input and send button in galaxy dock", () => {
    render(<ChatbotGalaxyComposer />);
    expect(screen.getByTestId("chatbot-galaxy-composer")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-input")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-send")).toBeInTheDocument();
  });

  it("sends message when clicking the send button", () => {
    render(<ChatbotGalaxyComposer />);
    fireEvent.change(screen.getByTestId("chatbot-input"), {
      target: { value: "Bonjour chatbot" },
    });
    fireEvent.click(screen.getByTestId("chatbot-send"));
    expect(sendMessage).toHaveBeenCalledWith("Bonjour chatbot");
  });

  it("disables send button when input is empty", () => {
    render(<ChatbotGalaxyComposer />);
    expect(screen.getByTestId("chatbot-send")).toBeDisabled();
  });
});
