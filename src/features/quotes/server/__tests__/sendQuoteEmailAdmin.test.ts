/** @jest-environment node */

import {
  buildQuoteEmailBody,
  sendQuoteEmailAdmin,
} from "@/features/quotes/server/sendQuoteEmailAdmin";
import type { Quote } from "@/features/quotes/types";

const mockSendViaGmailApi = jest.fn();
const mockEnsurePortalToken = jest.fn();
const mockBuildPdf = jest.fn();
const mockLoadBranding = jest.fn();

jest.mock("@/core/services/email/sendViaGmailApi", () => ({
  sendViaGmailApi: (...args: unknown[]) => mockSendViaGmailApi(...args),
}));

jest.mock("@/features/interventions/server/ensurePortalAccessTokenAdmin", () => ({
  ensurePortalAccessTokenAdmin: (...args: unknown[]) => mockEnsurePortalToken(...args),
}));

jest.mock("@/features/quotes/buildQuotePdfFromQuote", () => ({
  buildQuotePdfFromQuote: (...args: unknown[]) => mockBuildPdf(...args),
  quotePdfFileName: () => "devis-test.pdf",
}));

jest.mock("@/features/billing/loadBillingPdfBrandingForIntervention", () => ({
  loadBillingPdfBrandingForIntervention: (...args: unknown[]) => mockLoadBranding(...args),
}));

jest.mock("@/core/services/email/sendInterventionEmail", () => ({
  isGmailConfigured: () => true,
  isValidRecipientEmail: (email: string) => email.includes("@"),
  normalizeRecipientEmail: (email: string) => email.trim().toLowerCase(),
}));

jest.mock("@/core/services/email/gmailOAuthConfig", () => ({
  isGmailOAuthConfigured: async () => true,
}));

jest.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "__ts__" },
}));

function makeQuote(partial: Partial<Quote> = {}): Quote {
  return {
    id: "q-abc123",
    companyId: "co-1",
    interventionId: "iv-1",
    status: "draft",
    lines: [{ description: "MO", quantity: 1, unitPriceCents: 10000 }],
    totalCents: 10000,
    validityDays: 30,
    clientName: "Dupont",
    clientEmail: "client@example.com",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    expiresAt: "2027-01-01T00:00:00.000Z",
    ...partial,
  };
}

function makeDb(quote: Quote) {
  const quoteUpdate = jest.fn(async () => {});
  const emailAdd = jest.fn(async () => {});
  return {
    db: {
      collection: (name: string) => {
        if (name === "companies") {
          return {
            doc: () => ({
              collection: (sub: string) => {
                if (sub === "quotes") {
                  return {
                    doc: () => ({
                      get: async () => ({
                        exists: true,
                        id: quote.id,
                        data: () => quote,
                        ref: { update: quoteUpdate },
                      }),
                    }),
                  };
                }
                if (sub === "quote_emails") {
                  return { add: emailAdd };
                }
                throw new Error(`unexpected sub ${sub}`);
              },
            }),
          };
        }
        if (name === "interventions") {
          return {
            doc: () => ({
              get: async () => ({
                exists: true,
                id: "iv-1",
                data: () => ({ portalAccessToken: null, companyId: "co-1" }),
              }),
            }),
          };
        }
        throw new Error(`unexpected collection ${name}`);
      },
    },
    quoteUpdate,
    emailAdd,
  };
}

describe("buildQuoteEmailBody", () => {
  it("inclut le lien portail quand disponible", () => {
    const body = buildQuoteEmailBody({
      clientLabel: "Dupont",
      totalTtcEur: "106,00 €",
      validityDays: 30,
      portalUrl: "https://app.example/suivi/token-1",
    });
    expect(body).toContain("Suivez votre demande");
    expect(body).toContain("https://app.example/suivi/token-1");
  });
});

describe("sendQuoteEmailAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendViaGmailApi.mockResolvedValue(undefined);
    mockEnsurePortalToken.mockResolvedValue("portal-token-1");
    mockBuildPdf.mockReturnValue(new Uint8Array([1, 2, 3]));
    mockLoadBranding.mockResolvedValue(undefined);
    process.env.PUBLIC_APP_URL = "https://app.example";
  });

  it("envoie le devis en PDF et marque le statut sent", async () => {
    const quote = makeQuote();
    const { db, quoteUpdate, emailAdd } = makeDb(quote);

    const result = await sendQuoteEmailAdmin({
      db: db as never,
      companyId: "co-1",
      quoteId: quote.id,
      sentByUid: "uid-1",
    });

    expect(result).toEqual({ ok: true, emailSent: true });
    expect(mockEnsurePortalToken).toHaveBeenCalled();
    expect(mockSendViaGmailApi).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "client@example.com",
        attachment: expect.objectContaining({ filename: "devis-test.pdf" }),
      })
    );
    expect(quoteUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "sent", sentAt: expect.any(String) })
    );
    expect(emailAdd).toHaveBeenCalled();
  });

  it("refuse sans e-mail client", async () => {
    const quote = makeQuote({ clientEmail: "" });
    const { db } = makeDb(quote);

    const result = await sendQuoteEmailAdmin({
      db: db as never,
      companyId: "co-1",
      quoteId: quote.id,
      sentByUid: "uid-1",
    });

    expect(result).toEqual({
      ok: false,
      error: "E-mail client manquant ou invalide.",
      skipped: true,
    });
    expect(mockSendViaGmailApi).not.toHaveBeenCalled();
  });
});
