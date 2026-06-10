import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import ChatbotOrderGridTile from "@/features/chatbot/components/ChatbotOrderGridTile";

describe("ChatbotOrderGridTile", () => {
  it("renders image, title, tracking bar and handles click", () => {
    const onClick = jest.fn();
    render(
      <ChatbotOrderGridTile
        orderId="ord-1"
        title="Cylindre européen"
        subtitle="Dupont · 18 mai"
        imageUrl="https://lecot.be/media/catalog/product/demo.jpg"
        tracking={{ percent: 45, cancelled: false }}
        testIdPrefix="chatbot-supplier-order"
        onClick={onClick}
      />
    );

    expect(screen.getByTestId("chatbot-supplier-order-tile-ord-1")).toBeInTheDocument();
    expect(screen.getByTestId("chatbot-supplier-order-title-ord-1")).toHaveTextContent(
      "Cylindre européen"
    );
    expect(screen.getByTestId("chatbot-supplier-order-image-ord-1")).toHaveAttribute(
      "src",
      "https://lecot.be/media/catalog/product/demo.jpg"
    );
    expect(screen.getByTestId("chatbot-supplier-order-progress-bar-ord-1")).toHaveStyle({
      width: "45%",
    });

    fireEvent.click(screen.getByTestId("chatbot-supplier-order-tile-ord-1"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
