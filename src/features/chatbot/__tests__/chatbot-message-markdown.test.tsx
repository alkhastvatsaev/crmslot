import { render, screen } from "@testing-library/react";
import { renderChatbotMarkdownLite } from "@/features/chatbot/chatbot-message-markdown";

describe("chatbot-message-markdown", () => {
  it("renders lecot markdown links", () => {
    render(
      <div data-testid="wrap">
        {renderChatbotMarkdownLite(
          "Pièce : [Cylindre Yale](lecot:https://lecot.be/nl-be/catalogsearch/result?q=yale)",
        )}
      </div>,
    );
    const link = screen.getByTestId("chatbot-lecot-link");
    expect(link).toHaveAttribute(
      "href",
      "https://lecot.be/nl-be/catalogsearch/result?q=yale",
    );
    expect(link).toHaveTextContent("Cylindre Yale");
  });
});
