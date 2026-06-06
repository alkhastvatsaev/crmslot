import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import OrderTrackingProgressBar from "@/features/chatbot/components/OrderTrackingProgressBar";

describe("OrderTrackingProgressBar", () => {
  it("renders a thin fill bar at the given percent", () => {
    render(
      <OrderTrackingProgressBar
        orderId="ord-1"
        percent={45}
        testIdPrefix="chatbot-supplier-order"
      />
    );

    expect(screen.getByTestId("chatbot-supplier-order-progress-ord-1")).toBeInTheDocument();
    const bar = screen.getByTestId("chatbot-supplier-order-progress-bar-ord-1");
    expect(bar).toHaveStyle({ width: "45%" });
  });

  it("renders a muted line when cancelled", () => {
    render(
      <OrderTrackingProgressBar
        orderId="ord-2"
        percent={0}
        cancelled
        testIdPrefix="chatbot-material-order"
      />
    );

    expect(screen.getByTestId("chatbot-material-order-progress-ord-2")).toBeInTheDocument();
    expect(
      screen.queryByTestId("chatbot-material-order-progress-bar-ord-2")
    ).not.toBeInTheDocument();
  });
});
