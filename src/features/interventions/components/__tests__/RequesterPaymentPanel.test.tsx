import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import RequesterPaymentPanel from "@/features/interventions/components/RequesterPaymentPanel";

describe("RequesterPaymentPanel", () => {
  it("shows paid badge when paymentStatus is paid", () => {
    render(<RequesterPaymentPanel interventionId="iv-1" paymentStatus="paid" />);
    expect(screen.getByTestId("requester-payment-paid")).toBeInTheDocument();
  });

  it("shows pay button when unpaid", () => {
    render(
      <RequesterPaymentPanel
        interventionId="iv-1"
        paymentStatus="unpaid"
        invoiceAmountCents={12_500}
      />,
    );
    expect(screen.getByTestId("requester-pay-button")).toBeInTheDocument();
  });
});
