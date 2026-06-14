import { screen, waitFor } from "@testing-library/react";
import { render } from "@/test-utils/render";
import RequesterPaymentPanel from "@/features/interventions/components/RequesterPaymentPanel";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock("@/features/interventions/components/RequesterWalletCheckout", () => ({
  __esModule: true,
  default: () => <div data-testid="requester-wallet-checkout" />,
}));

import { fetchWithAuth } from "@/core/api/fetchWithAuth";

const mockFetchWithAuth = fetchWithAuth as jest.Mock;

describe("RequesterPaymentPanel", () => {
  beforeEach(() => {
    mockFetchWithAuth.mockReset();
  });

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
      />
    );
    expect(screen.getByTestId("requester-pay-button")).toBeInTheDocument();
  });

  it("loads wallet checkout in unified mode when client secret is available", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({
        clientSecret: "pi_secret_test",
        publishableKey: "pk_test_x",
      }),
    });

    render(
      <RequesterPaymentPanel
        interventionId="iv-1"
        paymentStatus="pending"
        invoiceAmountCents={17_000}
        compact
        premium
        unified
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("requester-wallet-checkout")).toBeInTheDocument();
    });
    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      "/api/stripe/create-payment-intent",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("shows card fallback when wallet intent is unavailable", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ clientSecret: null, mock: true }),
    });

    render(
      <RequesterPaymentPanel
        interventionId="iv-1"
        paymentStatus="pending"
        invoiceAmountCents={17_000}
        compact
        premium
        unified
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("requester-pay-card-fallback")).toBeInTheDocument();
    });
  });
});
