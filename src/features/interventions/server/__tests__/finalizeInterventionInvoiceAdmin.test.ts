/** @jest-environment node */

import { finalizeInterventionInvoiceAdmin } from "@/features/interventions/server/finalizeInterventionInvoiceAdmin";
import type { Intervention } from "@/features/interventions/types";

const mockSave = jest.fn(async () => undefined);

jest.mock("firebase-admin", () => ({
  storage: () => ({
    bucket: () => ({
      name: "test-bucket",
      file: () => ({ save: mockSave }),
    }),
  }),
}));

jest.mock("@/features/interventions/server/buildInterventionInvoicePdf", () => ({
  buildInterventionInvoicePdfBuffer: jest.fn(() => Buffer.from("%PDF-mock")),
  firebaseDownloadUrl: jest.fn(
    (bucket: string, path: string, token: string) =>
      `https://storage.example/${bucket}/${path}?token=${token}`,
  ),
  newDownloadToken: jest.fn(() => "token-abc"),
}));

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-pdf-1",
    title: "Porte",
    address: "Rue 1",
    time: "10:00",
    status: "done",
    location: { lat: 50.8, lng: 4.35 },
    billingLines: [{ description: "Main d'œuvre", quantity: 1, unitPriceCents: 12_000 }],
    ...partial,
  };
}

describe("finalizeInterventionInvoiceAdmin", () => {
  beforeEach(() => {
    mockSave.mockClear();
  });

  it("uploads PDF and returns invoice fields", async () => {
    const result = await finalizeInterventionInvoiceAdmin(iv(), "iv-pdf-1");
    expect(mockSave).toHaveBeenCalledWith(
      Buffer.from("%PDF-mock"),
      expect.objectContaining({ contentType: "application/pdf" }),
    );
    expect(result.invoicePdfStoragePath).toBe("invoices/iv-pdf-1.pdf");
    expect(result.invoiceAmountCents).toBe(12_000);
    expect(result.invoicePdfUrl).toContain("invoices/iv-pdf-1.pdf");
  });
});
