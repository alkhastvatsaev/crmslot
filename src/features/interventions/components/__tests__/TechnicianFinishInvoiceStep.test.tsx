import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import TechnicianFinishInvoiceStep from "../TechnicianFinishInvoiceStep";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

const { fetchWithAuth } = jest.requireMock("@/core/api/fetchWithAuth") as {
  fetchWithAuth: jest.Mock;
};

const INITIAL_LINES = [
  { description: "Forfait ouverture", quantity: 1, unitPriceCents: 12500 },
  { description: "Déplacement", quantity: 1, unitPriceCents: 4500 },
];

describe("TechnicianFinishInvoiceStep", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchWithAuth.mockImplementation((url: string) => {
      if (url.includes("prepare-draft-billing")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, billingLines: INITIAL_LINES }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, emailSent: true }),
      });
    });
  });

  it("affiche le total et le bouton envoyer uniquement", async () => {
    render(
      <TechnicianFinishInvoiceStep
        interventionId="iv-1"
        clientEmail="client@test.example"
        clientName="Dupont"
        initialLines={INITIAL_LINES}
      />
    );
    await waitFor(() => expect(screen.getByTestId("finish-invoice-total")).toBeInTheDocument());
    expect(screen.getByTestId("finish-invoice-send")).toBeInTheDocument();
    expect(screen.getByTestId("finish-invoice-adjust-open")).toBeInTheDocument();
    expect(screen.queryByTestId("finish-invoice-quick-add_travel")).not.toBeInTheDocument();
  });

  it("envoie la facture au clic sur envoyer", async () => {
    const onSent = jest.fn();
    render(
      <TechnicianFinishInvoiceStep
        interventionId="iv-1"
        clientEmail="client@test.example"
        initialLines={INITIAL_LINES}
        onSent={onSent}
      />
    );
    await waitFor(() => expect(screen.getByTestId("finish-invoice-send")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("finish-invoice-send"));
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        "/api/interventions/iv-1/issue-invoice",
        expect.objectContaining({ method: "POST" })
      );
      expect(onSent).toHaveBeenCalled();
    });
  });

  it("ouvre le panneau ajustement avec chips et lignes", async () => {
    render(
      <TechnicianFinishInvoiceStep
        interventionId="iv-1"
        clientEmail="client@test.example"
        initialLines={INITIAL_LINES}
      />
    );
    fireEvent.click(screen.getByTestId("finish-invoice-adjust-open"));
    expect(screen.getByTestId("finish-invoice-adjust-panel")).toBeInTheDocument();
    expect(screen.getByTestId("finish-invoice-quick-add_travel")).toBeInTheDocument();
    expect(screen.getByTestId("finish-invoice-line-0")).toBeInTheDocument();
    expect(screen.getByTestId("finish-invoice-regenerate")).toBeInTheDocument();
  });

  it("met à jour le total via chip et supprime une ligne", async () => {
    render(
      <TechnicianFinishInvoiceStep
        interventionId="iv-1"
        clientEmail="client@test.example"
        initialLines={INITIAL_LINES}
      />
    );
    fireEvent.click(screen.getByTestId("finish-invoice-adjust-open"));
    const totalEl = screen.getByTestId("finish-invoice-adjust-total");
    const before = totalEl.textContent;
    fireEvent.click(screen.getByTestId("finish-invoice-quick-discount_10"));
    await waitFor(() => expect(totalEl.textContent).not.toBe(before));
    fireEvent.click(screen.getByTestId("finish-invoice-line-remove-0"));
    await waitFor(() => {
      expect(screen.getAllByTestId(/^finish-invoice-line-\d+$/).length).toBe(1);
    });
  });

  it("envoie la facture corrigée depuis le panneau ajustement", async () => {
    const onSent = jest.fn();
    render(
      <TechnicianFinishInvoiceStep
        interventionId="iv-1"
        clientEmail="client@test.example"
        initialLines={INITIAL_LINES}
        onSent={onSent}
      />
    );
    fireEvent.click(screen.getByTestId("finish-invoice-adjust-open"));
    fireEvent.click(screen.getByTestId("finish-invoice-adjust-send"));
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        "/api/interventions/iv-1/issue-invoice",
        expect.objectContaining({ method: "POST" })
      );
      expect(onSent).toHaveBeenCalled();
    });
  });
});
