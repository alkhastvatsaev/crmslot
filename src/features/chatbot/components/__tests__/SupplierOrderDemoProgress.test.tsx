import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import SupplierOrderDemoProgress from "@/features/chatbot/components/SupplierOrderDemoProgress";

describe("SupplierOrderDemoProgress", () => {
  it("renders step labels for demo sent order", () => {
    render(<SupplierOrderDemoProgress orderId="ord-demo" status="sent" />);
    expect(screen.getByTestId("chatbot-supplier-order-demo-progress-ord-demo")).toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-supplier-order-demo-progress-bar-ord-demo")).not.toBeInTheDocument();
    expect(screen.getByText("Validée")).toBeInTheDocument();
    expect(screen.getByText("Préparation")).toBeInTheDocument();
    expect(screen.getByText("Expédiée")).toBeInTheDocument();
    expect(screen.getByText("Livrée")).toBeInTheDocument();
  });
});
