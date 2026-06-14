import { render, screen } from "@/test-utils/render";
import InterventionInvoicePreviewCard from "@/features/billing/components/InterventionInvoicePreviewCard";

describe("InterventionInvoicePreviewCard", () => {
  it("shows empty state when no lines and no PDF", () => {
    render(<InterventionInvoicePreviewCard billingLines={[]} />);
    expect(screen.getByTestId("backoffice-invoice-preview-empty")).toBeInTheDocument();
  });

  it("renders billing lines and total for back-office review", () => {
    render(
      <InterventionInvoicePreviewCard
        clientName="Dupont"
        billingLines={[
          { description: "Déplacement", quantity: 1, unitPriceCents: 4500 },
          { description: "Main d'œuvre", quantity: 1, unitPriceCents: 8500 },
        ]}
        invoiceAmountCents={13000}
        aiNote="Forfait serrurerie standard"
      />
    );
    expect(screen.getByTestId("backoffice-invoice-preview")).toBeInTheDocument();
    expect(screen.getByText("Déplacement")).toBeInTheDocument();
    expect(screen.getByText("Main d'œuvre")).toBeInTheDocument();
    expect(screen.getByTestId("backoffice-invoice-preview-total")).toHaveTextContent(/130/);
    expect(screen.getByTestId("backoffice-invoice-preview-ai-note")).toHaveTextContent(
      "Forfait serrurerie standard"
    );
  });

  it("embeds PDF when invoicePdfUrl is set", () => {
    render(
      <InterventionInvoicePreviewCard
        invoicePdfUrl="https://example.com/invoice.pdf"
        invoiceNumber="FAC-2026-001"
      />
    );
    expect(screen.getByTestId("backoffice-invoice-pdf-embed")).toHaveAttribute(
      "src",
      "https://example.com/invoice.pdf"
    );
    expect(screen.getByTestId("backoffice-invoice-pdf-link")).toHaveAttribute(
      "href",
      "https://example.com/invoice.pdf"
    );
  });
});
