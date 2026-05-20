import { fireEvent, render, screen } from "@testing-library/react";
import ChatbotQuickActions from "@/features/chatbot/components/ChatbotQuickActions";
import type { ChatbotQuickAction } from "@/features/chatbot/chatbot-quick-actions";

describe("ChatbotQuickActions", () => {
  const actions: ChatbotQuickAction[] = [
    {
      id: "order-1",
      label: "Commander · Serrure",
      kind: "send_message",
      payload: "Commander LEC-2001 — Serrure",
      variant: "primary",
    },
    {
      id: "link-1",
      label: "Voir sur Lecot",
      kind: "open_url",
      payload: "https://lecot.be/search",
      variant: "outline",
    },
  ];

  it("renders nothing when actions array is empty", () => {
    const { container } = render(
      <ChatbotQuickActions actions={[]} onSendMessage={jest.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a button per action", () => {
    render(<ChatbotQuickActions actions={actions} onSendMessage={jest.fn()} />);
    expect(screen.getByTestId("chatbot-quick-actions")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-quick-action-order-1")).toHaveTextContent(
      "Commander · Serrure",
    );
    expect(screen.getByTestId("chatbot-quick-action-link-1")).toBeInTheDocument();
  });

  it("send_message click calls onSendMessage with payload", () => {
    const onSendMessage = jest.fn();
    render(<ChatbotQuickActions actions={actions} onSendMessage={onSendMessage} />);
    fireEvent.click(screen.getByTestId("chatbot-quick-action-order-1"));
    expect(onSendMessage).toHaveBeenCalledWith("Commander LEC-2001 — Serrure");
  });

  it("open_url click opens a new window", () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    const onSendMessage = jest.fn();
    render(<ChatbotQuickActions actions={actions} onSendMessage={onSendMessage} />);
    fireEvent.click(screen.getByTestId("chatbot-quick-action-link-1"));
    expect(openSpy).toHaveBeenCalledWith(
      "https://lecot.be/search",
      "_blank",
      "noopener,noreferrer",
    );
    expect(onSendMessage).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("disables all buttons when disabled prop is true", () => {
    render(<ChatbotQuickActions actions={actions} disabled onSendMessage={jest.fn()} />);
    expect(screen.getByTestId("chatbot-quick-action-order-1")).toBeDisabled();
    expect(screen.getByTestId("chatbot-quick-action-link-1")).toBeDisabled();
  });
});
