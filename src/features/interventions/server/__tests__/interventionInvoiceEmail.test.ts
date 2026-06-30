/**
 * @jest-environment node
 */
import { makeIntervention } from "@/test-utils/factories";
import {
  buildInterventionInvoiceEmailBody,
  interventionClientRecipient,
  sendInterventionInvoiceEmailToClient,
} from "@/features/interventions/server/interventionInvoiceEmail";

jest.mock("@/core/config/publicAppUrl", () => ({
  buildPortalSuiviUrl: jest.fn((token: string) => `https://app.test/suivi/${token}`),
}));

jest.mock("@/core/services/email/sendInterventionEmail", () => ({
  isGmailConfigured: jest.fn(() => true),
  isValidRecipientEmail: jest.fn((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
  normalizeRecipientEmail: jest.fn((email: string) => email.trim().toLowerCase()),
  sendInterventionEmail: jest.fn(),
}));

import {
  isGmailConfigured,
  sendInterventionEmail,
} from "@/core/services/email/sendInterventionEmail";

const isGmailConfiguredMock = isGmailConfigured as jest.MockedFunction<typeof isGmailConfigured>;
const sendInterventionEmailMock = sendInterventionEmail as jest.MockedFunction<
  typeof sendInterventionEmail
>;

describe("interventionClientRecipient", () => {
  it("retourne l'e-mail normalisé quand valide", () => {
    const iv = makeIntervention({ clientEmail: "  Client@Example.COM  " });
    expect(interventionClientRecipient(iv)).toBe("client@example.com");
  });

  it("retourne null si e-mail absent ou invalide", () => {
    expect(interventionClientRecipient(makeIntervention({ clientEmail: "" }))).toBeNull();
    expect(
      interventionClientRecipient(makeIntervention({ clientEmail: "pas-un-mail" }))
    ).toBeNull();
  });
});

describe("buildInterventionInvoiceEmailBody", () => {
  it("inclut le suivi portail et le lien de paiement", () => {
    const body = buildInterventionInvoiceEmailBody({
      clientLabel: "Marie",
      portalUrl: "https://app.test/suivi/abc",
      paymentLinkUrl: "https://pay.test/inv",
    });
    expect(body).toContain("Bonjour Marie");
    expect(body).toContain("Suivi en ligne : https://app.test/suivi/abc");
    expect(body).toContain("Payer en ligne (carte bancaire) : https://pay.test/inv");
    expect(body).toContain("MAP BELGIQUE");
  });

  it("fonctionne sans liens optionnels", () => {
    const body = buildInterventionInvoiceEmailBody({ clientLabel: "Client" });
    expect(body).not.toContain("Suivi en ligne");
    expect(body).not.toContain("Payer en ligne");
  });
});

describe("sendInterventionInvoiceEmailToClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isGmailConfiguredMock.mockReturnValue(true);
    sendInterventionEmailMock.mockResolvedValue({ ok: true, messageId: "msg-1" });
  });

  it("skip si aucun e-mail client", async () => {
    const result = await sendInterventionInvoiceEmailToClient({
      interventionId: "iv-1",
      iv: makeIntervention({ clientEmail: null }),
      sentByUid: "uid-1",
    });
    expect(result).toEqual({
      ok: false,
      error: "Aucun e-mail client valide sur le dossier.",
      skipped: true,
    });
    expect(sendInterventionEmailMock).not.toHaveBeenCalled();
  });

  it("échoue si Gmail non configuré", async () => {
    isGmailConfiguredMock.mockReturnValue(false);
    const result = await sendInterventionInvoiceEmailToClient({
      interventionId: "iv-1",
      iv: makeIntervention({ clientEmail: "client@test.com" }),
      sentByUid: "uid-1",
    });
    expect(result).toEqual({ ok: false, error: "Envoi e-mail non configuré (Gmail)." });
  });

  it("échoue si companyId manquant", async () => {
    const result = await sendInterventionInvoiceEmailToClient({
      interventionId: "iv-1",
      iv: makeIntervention({ clientEmail: "client@test.com", companyId: "" }),
      sentByUid: "uid-1",
    });
    expect(result).toEqual({ ok: false, error: "companyId manquant." });
  });

  it("envoie la facture avec pièce jointe invoice", async () => {
    const iv = makeIntervention({
      clientEmail: "client@test.com",
      companyId: "co-1",
      clientName: "Dupont",
      portalAccessToken: "tok-1",
      stripePaymentLinkUrl: "https://pay.test/1",
    });

    const result = await sendInterventionInvoiceEmailToClient({
      interventionId: "iv-long-id-12345678",
      iv,
      sentByUid: "uid-admin",
    });

    expect(result).toEqual({ ok: true });
    expect(sendInterventionEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        interventionId: "iv-long-id-12345678",
        companyId: "co-1",
        to: "client@test.com",
        sentByUid: "uid-admin",
        attachDocumentType: "invoice",
        subject: expect.stringContaining("12345678"),
        bodyText: expect.stringContaining("Dupont"),
      })
    );
  });

  it("propage l'erreur d'envoi", async () => {
    sendInterventionEmailMock.mockResolvedValue({ ok: false, error: "SMTP down" });
    const result = await sendInterventionInvoiceEmailToClient({
      interventionId: "iv-1",
      iv: makeIntervention({ clientEmail: "client@test.com" }),
      sentByUid: "uid-1",
    });
    expect(result).toEqual({ ok: false, error: "SMTP down" });
  });
});
