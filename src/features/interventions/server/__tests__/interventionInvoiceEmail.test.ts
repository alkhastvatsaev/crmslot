/** @jest-environment node */

import {
  interventionClientRecipient,
  sendInterventionInvoiceEmailToClient,
} from "@/features/interventions/server/interventionInvoiceEmail";
import type { Intervention } from "@/features/interventions/types";

const mockSend = jest.fn();

jest.mock("@/core/services/email/sendInterventionEmail", () => ({
  sendInterventionEmail: (...args: unknown[]) => mockSend(...args),
  isGmailConfigured: jest.fn(() => true),
  isValidRecipientEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  normalizeRecipientEmail: (raw: string) => raw.trim().toLowerCase(),
}));

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-mail-1",
    title: "Porte",
    address: "Rue 1",
    time: "10:00",
    status: "invoiced",
    location: { lat: 50.8, lng: 4.35 },
    companyId: "co-1",
    clientEmail: "client@example.com",
    clientName: "Dupont",
    ...partial,
  };
}

describe("interventionInvoiceEmail", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ ok: true, messageId: "msg-1" });
  });

  it("interventionClientRecipient returns normalized email", () => {
    expect(interventionClientRecipient(iv({ clientEmail: "  Client@Test.BE " }))).toBe(
      "client@test.be",
    );
  });

  it("interventionClientRecipient returns null when invalid", () => {
    expect(interventionClientRecipient(iv({ clientEmail: "pas-un-mail" }))).toBeNull();
  });

  it("sendInterventionInvoiceEmailToClient skips when no client email", async () => {
    const result = await sendInterventionInvoiceEmailToClient({
      interventionId: "iv-mail-1",
      iv: iv({ clientEmail: null }),
      sentByUid: "uid-1",
    });
    expect(result).toEqual({
      ok: false,
      error: "Aucun e-mail client valide sur le dossier.",
      skipped: true,
    });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sendInterventionInvoiceEmailToClient sends invoice attachment", async () => {
    const result = await sendInterventionInvoiceEmailToClient({
      interventionId: "iv-mail-1",
      iv: iv(),
      sentByUid: "uid-dispatch",
    });
    expect(result).toEqual({ ok: true });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        interventionId: "iv-mail-1",
        companyId: "co-1",
        to: "client@example.com",
        attachDocumentType: "invoice",
        sentByUid: "uid-dispatch",
      }),
    );
  });
});
