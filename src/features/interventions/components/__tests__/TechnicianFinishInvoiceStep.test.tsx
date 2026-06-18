import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import TechnicianFinishInvoiceStep from "../TechnicianFinishInvoiceStep";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock("@/features/interventions/useBrowserSpeechDictation", () => ({
  useBrowserSpeechDictation: (append: (text: string) => void) => ({
    listening: false,
    supported: true,
    toggleListening: jest.fn(() => append("Note vocale test")),
    stop: jest.fn(),
    interimTranscript: "",
  }),
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
      if (url.includes("request-invoice-review")) {
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
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
    expect(screen.getByTestId("finish-invoice-escalate-open")).toBeInTheDocument();
    expect(screen.queryByTestId("finish-invoice-quick-add_travel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("finish-invoice-add-line")).not.toBeInTheDocument();
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

  it("transmet au back-office avec note vocale", async () => {
    const onSkip = jest.fn();
    render(
      <TechnicianFinishInvoiceStep
        interventionId="iv-1"
        clientEmail="client@test.example"
        initialLines={INITIAL_LINES}
        onSkip={onSkip}
      />
    );
    fireEvent.click(screen.getByTestId("finish-invoice-escalate-open"));
    expect(screen.getByTestId("finish-invoice-escalate-panel")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("finish-invoice-voice-mic"));
    await waitFor(() =>
      expect(screen.getByTestId("finish-invoice-voice-note")).toHaveTextContent("Note vocale test")
    );
    fireEvent.click(screen.getByTestId("finish-invoice-escalate-submit"));
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        "/api/interventions/iv-1/request-invoice-review",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ note: "Note vocale test" }),
        })
      );
      expect(onSkip).toHaveBeenCalled();
    });
  });
});
