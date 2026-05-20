import { render, screen } from "@testing-library/react";
import SupplierOrderDemoProgress from "@/features/chatbot/components/SupplierOrderDemoProgress";

describe("SupplierOrderDemoProgress", () => {
  it("renders steps and progress bar for demo sent order", () => {
    render(<SupplierOrderDemoProgress orderId="ord-demo" status="sent" />);
    expect(screen.getByTestId("chatbot-supplier-order-demo-progress-ord-demo")).toBeInTheDocument();
    expect(screen.getByText("Validée")).toBeInTheDocument();
    expect(screen.getByText("Préparation")).toBeInTheDocument();
    expect(screen.getByText("Expédiée")).toBeInTheDocument();
    expect(screen.getByText("Livrée")).toBeInTheDocument();
    const bar = screen.getByTestId("chatbot-supplier-order-demo-progress-bar-ord-demo");
    expect(bar).toHaveAttribute("aria-valuenow", "45");
  });
});
