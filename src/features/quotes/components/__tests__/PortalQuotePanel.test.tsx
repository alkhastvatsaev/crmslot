import { fireEvent, screen, waitFor } from "@testing-library/react";
import { render } from "@/test-utils/render";
import PortalQuotePanel from "@/features/quotes/components/PortalQuotePanel";
import type { PortalQuoteSummary } from "@/features/quotes/portalQuoteSummary";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

function makeQuote(partial: Partial<PortalQuoteSummary> = {}): PortalQuoteSummary {
  return {
    id: "q-portal-1",
    status: "sent",
    effectiveStatus: "sent",
    lines: [{ description: "Cylindre", quantity: 1, unitPriceCents: 12000 }],
    totalCents: 12000,
    totalTtcCents: 12720,
    validityDays: 30,
    expiresAt: "2027-01-01T00:00:00.000Z",
    sentAt: "2026-06-02T00:00:00.000Z",
    respondedAt: null,
    canRespond: true,
    ...partial,
  };
}

describe("PortalQuotePanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, invoiceIssued: false }),
    }) as jest.Mock;
  });

  it("affiche les boutons accepter/refuser pour un devis envoyé", () => {
    render(<PortalQuotePanel portalToken="token-abc" quotes={[makeQuote()]} />);
    expect(screen.getByTestId("portal-quote-panel")).toBeInTheDocument();
    expect(screen.getByTestId("portal-quote-accept-q-portal-1")).toBeInTheDocument();
    expect(screen.getByTestId("portal-quote-decline-q-portal-1")).toBeInTheDocument();
  });

  it("appelle l'API accept et rafraîchit la page", async () => {
    render(<PortalQuotePanel portalToken="token-abc" quotes={[makeQuote()]} />);
    fireEvent.click(screen.getByTestId("portal-quote-accept-q-portal-1"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/portal/token-abc/quotes/q-portal-1/accept", {
        method: "POST",
      });
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("affiche le badge accepté sans boutons", () => {
    render(
      <PortalQuotePanel
        portalToken="token-abc"
        quotes={[makeQuote({ canRespond: false, effectiveStatus: "accepted", status: "accepted" })]}
      />
    );
    expect(screen.getByTestId("portal-quote-status-q-portal-1")).toBeInTheDocument();
    expect(screen.queryByTestId("portal-quote-accept-q-portal-1")).not.toBeInTheDocument();
  });
});
