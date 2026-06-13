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
          json: async () => ({
            ok: true,
            billingLines: INITIAL_LINES,
            aiNote: "Forfait porte claquée",
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, emailSent: true }),
      });
    });
  });

  it("affiche le total et les boutons d'ajustement", async () => {
    render(
      <TechnicianFinishInvoiceStep
        interventionId="iv-1"
        clientEmail="client@test.example"
        clientName="Dupont"
      />
    );
    await waitFor(() => expect(screen.getByTestId("finish-invoice-total")).toBeInTheDocument());
    expect(screen.getByTestId("finish-invoice-quick-add_travel")).toBeInTheDocument();
    expect(screen.getByTestId("finish-invoice-send")).toBeInTheDocument();
  });

  it("affiche le bouton aperçu", async () => {
    render(
      <TechnicianFinishInvoiceStep
        interventionId="iv-1"
        clientEmail="client@test.example"
        initialLines={INITIAL_LINES}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId("finish-invoice-preview-btn")).not.toBeDisabled()
    );
  });

  it("ouvre l'aperçu facture au clic sur le bouton aperçu", async () => {
    render(
      <TechnicianFinishInvoiceStep
        interventionId="iv-1"
        clientEmail="client@test.example"
        clientName="Martin"
        initialLines={INITIAL_LINES}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId("finish-invoice-preview-btn")).not.toBeDisabled()
    );
    fireEvent.click(screen.getByTestId("finish-invoice-preview-btn"));
    expect(screen.getByTestId("finish-invoice-preview")).toBeInTheDocument();
    // Shows billing lines in the preview
    expect(screen.getAllByText("Forfait ouverture").length).toBeGreaterThan(0);
  });

  it("ferme l'aperçu en cliquant sur la croix", async () => {
    render(
      <TechnicianFinishInvoiceStep
        interventionId="iv-1"
        clientEmail="client@test.example"
        initialLines={INITIAL_LINES}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId("finish-invoice-preview-btn")).not.toBeDisabled()
    );
    fireEvent.click(screen.getByTestId("finish-invoice-preview-btn"));
    expect(screen.getByTestId("finish-invoice-preview")).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getByRole("button", { name: /fermer/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId("finish-invoice-preview")).not.toBeInTheDocument();
  });

  it("envoie la facture au clic sur le bouton envoyer principal", async () => {
    render(
      <TechnicianFinishInvoiceStep
        interventionId="iv-1"
        clientEmail="client@test.example"
        initialLines={[{ description: "MO", quantity: 1, unitPriceCents: 5500 }]}
      />
    );
    await waitFor(() => expect(screen.getByTestId("finish-invoice-send")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("finish-invoice-send"));
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        "/api/interventions/iv-1/issue-invoice",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("supprime une ligne via le bouton supprimer", async () => {
    render(
      <TechnicianFinishInvoiceStep
        interventionId="iv-1"
        clientEmail="client@test.example"
        initialLines={INITIAL_LINES}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId("finish-invoice-line-delete-0")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByTestId("finish-invoice-line-delete-0"));
    expect(screen.queryByText("Forfait ouverture")).not.toBeInTheDocument();
    // second line still present
    expect(screen.getByText("Déplacement")).toBeInTheDocument();
  });

  it("ajoute une nouvelle ligne via le formulaire d'ajout", async () => {
    render(
      <TechnicianFinishInvoiceStep
        interventionId="iv-1"
        clientEmail="client@test.example"
        initialLines={INITIAL_LINES}
      />
    );
    await waitFor(() => expect(screen.getByTestId("finish-invoice-add-line")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("finish-invoice-add-line"));

    const [descInput, priceInput] = screen.getAllByRole("textbox").slice(-2);
    fireEvent.change(descInput, { target: { value: "Nouveau joint" } });
    // Use number input
    const numberInputs = screen.getAllByDisplayValue("");
    // Find price input (type number) — fallback: query by placeholder
    const priceField = screen.getByPlaceholderText(/Prix €/i);
    fireEvent.change(priceField, { target: { value: "25" } });

    fireEvent.click(screen.getByTestId("finish-invoice-add-line-confirm"));
    expect(screen.getByText("Nouveau joint")).toBeInTheDocument();
  });
});
