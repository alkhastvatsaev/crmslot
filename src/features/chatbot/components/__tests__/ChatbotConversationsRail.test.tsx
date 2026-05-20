import { screen } from "@testing-library/react";
import { fireEvent, render } from "@/test-utils/render";
import ChatbotConversationsRail from "@/features/chatbot/components/ChatbotConversationsRail";

const setActiveId = jest.fn();
const newConversation = jest.fn();

jest.mock("@/features/chatbot/ChatbotContext", () => ({
  useChatbotContext: () => ({
    conversations: [
      {
        id: "c1",
        title: "Briefing du jour",
        createdAt: 1,
        updatedAt: 2,
        messages: [{ id: "m1", role: "user", content: "Bonjour", createdAt: 1 }],
      },
      {
        id: "c2",
        title: "Facture client",
        createdAt: 3,
        updatedAt: 4,
        messages: [],
      },
    ],
    activeId: "c1",
    setActiveId,
    newConversation,
  }),
}));

describe("ChatbotConversationsRail", () => {
  beforeEach(() => {
    setActiveId.mockClear();
    newConversation.mockClear();
  });

  it("renders conversation history in left rail", () => {
    render(<ChatbotConversationsRail />);
    expect(screen.getByTestId("chatbot-conversations-rail")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-conversation-c1")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-conversation-c2")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-new-conversation")).toBeInTheDocument();
  });

  it("switches active conversation on click", () => {
    render(<ChatbotConversationsRail />);
    fireEvent.click(screen.getByTestId("chatbot-conversation-c2"));
    expect(setActiveId).toHaveBeenCalledWith("c2");
  });
});
