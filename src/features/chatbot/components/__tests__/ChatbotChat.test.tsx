import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import ChatbotChat from "@/features/chatbot/components/ChatbotChat";
import type { ChatbotQuickAction } from "@/features/chatbot/chatbot-quick-actions";

const mockChatbotContext = {
  companyId: "demo-co",
  companyName: "Demo",
  conversations: [] as unknown[],
  activeConversation: null as {
    id: string;
    title: string;
    messages: {
      id: string;
      role: "user" | "assistant";
      content: string;
      actions?: ChatbotQuickAction[];
    }[];
    updatedAt: number;
  } | null,
  activeId: null as string | null,
  setActiveId: jest.fn(),
  newConversation: jest.fn(),
  sendMessage: jest.fn(),
  streaming: false,
  streamingText: "",
  activeTool: null as { tool: string; label: string } | null,
  pendingTool: null,
  confirmPendingTool: jest.fn(),
  cancelPendingTool: jest.fn(),
  error: null as string | null,
};

jest.mock("@/features/chatbot/ChatbotContext", () => ({
  useChatbotContext: () => mockChatbotContext,
}));

describe("ChatbotChat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatbotContext.activeConversation = null;
    mockChatbotContext.streaming = false;
    mockChatbotContext.streamingText = "";
    mockChatbotContext.activeTool = null;
  });

  it("renders chat without central input (composer in galaxy dock)", () => {
    render(<ChatbotChat />);
    expect(screen.getByTestId("chatbot-chat")).toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-new-conversation")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-input")).not.toBeInTheDocument();
  });

  it("renders quick action chips on catalogue Lecot reply", () => {
    mockChatbotContext.activeConversation = {
      id: "c1",
      title: "Test",
      messages: [
        {
          id: "m1",
          role: "assistant",
          content:
            "**Catalogue Lecot** :\n1. [Serrure](lecot:https://lecot.be/q) — 145,00 € HT (SKU LEC-2001)",
        },
      ],
      updatedAt: Date.now(),
    };
    render(<ChatbotChat />);
    expect(screen.getByTestId("chatbot-quick-actions")).toBeInTheDocument();
    expect(
      screen.getAllByTestId("chatbot-quick-action-lecot-derived-1-LEC-2001").length,
    ).toBeGreaterThan(0);
  });

  it("renders suggestion tag chips on latest assistant message", () => {
    mockChatbotContext.activeConversation = {
      id: "c1",
      title: "Test",
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "Confirmer ? <suggestion>Oui, commander</suggestion><suggestion>Non merci</suggestion>",
        },
      ],
      updatedAt: Date.now(),
    };
    render(<ChatbotChat />);
    expect(screen.getByTestId("chatbot-quick-action-suggestion-tag-0")).toHaveTextContent(
      "Oui, commander",
    );
    expect(screen.getByTestId("chatbot-quick-action-suggestion-tag-1")).toHaveTextContent(
      "Non merci",
    );
  });

  it("clicking a quick action calls sendMessage", () => {
    mockChatbotContext.activeConversation = {
      id: "c1",
      title: "Test",
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "**Catalogue Lecot** :\n1. [Serrure](lecot:https://lecot.be/q) — 10 € (SKU LEC-2001)",
        },
      ],
      updatedAt: Date.now(),
    };
    render(<ChatbotChat />);
    fireEvent.click(screen.getByTestId("chatbot-quick-action-lecot-derived-1-LEC-2001"));
    expect(mockChatbotContext.sendMessage).toHaveBeenCalledWith(
      "Commander LEC-2001 — Serrure",
    );
  });

  it("uses stored actions from message when present", () => {
    mockChatbotContext.activeConversation = {
      id: "c1",
      title: "Test",
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "Choisissez un article.",
          actions: [
            {
              id: "stored-1",
              label: "Commander · Test SKU",
              kind: "send_message",
              payload: "Commander LEC-999 — Test",
              variant: "primary",
            },
          ],
        },
      ],
      updatedAt: Date.now(),
    };
    render(<ChatbotChat />);
    expect(screen.getByTestId("chatbot-quick-action-stored-1")).toBeInTheDocument();
  });

  it("does not show quick actions on older assistant bubbles", () => {
    mockChatbotContext.activeConversation = {
      id: "c1",
      title: "Test",
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "**Catalogue Lecot** :\n1. [A](lecot:https://lecot.be) — 1 € (SKU LEC-1)",
        },
        { id: "m2", role: "user", content: "merci" },
        { id: "m3", role: "assistant", content: "De rien." },
      ],
      updatedAt: Date.now(),
    };
    render(<ChatbotChat />);
    expect(screen.queryByTestId("chatbot-quick-actions")).not.toBeInTheDocument();
  });

  it("does not show startup prompt suggestion chips when conversation is empty", () => {
    render(<ChatbotChat />);
    expect(screen.queryByTestId("chatbot-empty-suggestions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-quick-action-prompt-0")).not.toBeInTheDocument();
  });

  it("renders clickable lecot links in assistant messages", () => {
    mockChatbotContext.activeConversation = {
      id: "c1",
      title: "Test",
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "Commande : [Cylindre](lecot:https://lecot.be/nl-be/catalogsearch/result?q=cylindre)",
        },
      ],
      updatedAt: Date.now(),
    };
    render(<ChatbotChat />);
    const link = screen.getByTestId("chatbot-lecot-link");
    expect(link).toHaveAttribute("href", expect.stringContaining("lecot.be"));
  });

  it("extracts <suggestion> tags and renders them as clickable buttons", () => {
    mockChatbotContext.activeConversation = {
      id: "c1",
      title: "Test",
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "Voulez-vous que je commande ce produit ?\n<suggestion>Oui, commander</suggestion>\n<suggestion>Non merci</suggestion>",
        },
      ],
      updatedAt: Date.now(),
    };
    render(<ChatbotChat />);

    // Les tags doivent être masqués dans le texte
    const bubble = screen.getByTestId("chatbot-bubble-assistant");
    expect(bubble).toHaveTextContent("Voulez-vous que je commande ce produit ?");
    expect(bubble).not.toHaveTextContent("<suggestion>");

    // Les boutons doivent être présents
    const ouiBtn = screen.getByRole("button", { name: "Oui, commander" });
    const nonBtn = screen.getByRole("button", { name: "Non merci" });
    expect(ouiBtn).toBeInTheDocument();
    expect(nonBtn).toBeInTheDocument();

    // Cliquer sur un bouton déclenche sendMessage
    ouiBtn.click();
    expect(mockChatbotContext.sendMessage).toHaveBeenCalledWith("Oui, commander");
  });

  it("does not parse <suggestion> tags in user messages", () => {
    mockChatbotContext.activeConversation = {
      id: "c1",
      title: "Test",
      messages: [
        {
          id: "m1",
          role: "user",
          content: "Je veux commander <suggestion>Option A</suggestion>",
        },
      ],
      updatedAt: Date.now(),
    };
    render(<ChatbotChat />);
    expect(screen.queryByRole("button", { name: "Option A" })).not.toBeInTheDocument();
  });

  it("does not show suggestion chips on stored messages while streaming", () => {
    mockChatbotContext.streaming = true;
    mockChatbotContext.streamingText = "En cours...";
    mockChatbotContext.activeConversation = {
      id: "c1",
      title: "Test",
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "Confirmez ? <suggestion>Oui</suggestion><suggestion>Non</suggestion>",
        },
      ],
      updatedAt: Date.now(),
    };
    render(<ChatbotChat />);
    // isLatest=false when streaming is true, so no suggestion chips on stored messages
    expect(screen.queryByTestId("chatbot-quick-action-suggestion-tag-0")).not.toBeInTheDocument();
  });

  it("handles multiple <suggestion> tags of various cases (case-insensitive)", () => {
    mockChatbotContext.activeConversation = {
      id: "c1",
      title: "Test",
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "Options : <SUGGESTION>Option majuscule</SUGGESTION><Suggestion>Option mixte</Suggestion>",
        },
      ],
      updatedAt: Date.now(),
    };
    render(<ChatbotChat />);
    expect(screen.getByRole("button", { name: "Option majuscule" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Option mixte" })).toBeInTheDocument();
  });
});
