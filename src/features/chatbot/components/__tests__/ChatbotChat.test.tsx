import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import ChatbotChat from "@/features/chatbot/components/ChatbotChat";

jest.mock("@/features/chatbot/ChatbotContext", () => ({
  useChatbotContext: () => ({
    companyId: "demo-co",
    companyName: "Demo",
    conversations: [],
    activeConversation: null,
    activeId: null,
    setActiveId: jest.fn(),
    newConversation: jest.fn(),
    sendMessage: jest.fn(),
    streaming: false,
    streamingText: "",
    pendingTool: null,
    confirmPendingTool: jest.fn(),
    cancelPendingTool: jest.fn(),
    error: null,
  }),
}));

describe("ChatbotChat", () => {
  it("renders chat without central input (composer in galaxy dock)", () => {
    render(<ChatbotChat />);
    expect(screen.getByTestId("chatbot-chat")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-new-conversation")).toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-input")).not.toBeInTheDocument();
  });
});
