const mockBuildPdf = jest.fn();
const mockSendViaGmailApi = jest.fn();
const mockTransporterSendMail = jest.fn();

jest.mock("@/core/services/email/interventionEmailPdfAttachment", () => ({
  buildInterventionEmailPdfAttachment: (...args: unknown[]) => mockBuildPdf(...args),
}));

jest.mock("@/core/services/email/sendViaGmailApi", () => ({
  sendViaGmailApi: (...args: unknown[]) => mockSendViaGmailApi(...args),
}));

jest.mock("nodemailer", () => ({
  createTransport: () => ({
    sendMail: (...args: unknown[]) => mockTransporterSendMail(...args),
  }),
}));

jest.mock("@/core/config/firebase-admin", () => ({
  getAdminDb: () => ({
    collection: () => ({
      add: jest.fn().mockResolvedValue({ id: "mail-1" }),
    }),
  }),
}));

jest.mock("@/core/services/email/gmailOAuthConfig", () => ({
  isGmailOAuthConfigured: () => true,
  getGmailOAuthConfig: () => ({
    clientId: "id",
    clientSecret: "sec",
    redirectUri: "http://localhost",
    refreshToken: "rt",
    senderEmail: "test@example.com",
  }),
}));

import { sendInterventionEmail } from "@/core/services/email/sendInterventionEmail";

describe("sendInterventionEmail PDF attachment", () => {
  const prevEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GMAIL_USER = "test@example.com";
    process.env.GMAIL_APP_PASSWORD = "secret";
    mockBuildPdf.mockResolvedValue({
      filename: "facture-iv1.pdf",
      content: Buffer.from("%PDF-1.4 mock"),
      contentType: "application/pdf",
    });
    mockSendViaGmailApi.mockResolvedValue(undefined);
  });

  afterAll(() => {
    process.env = prevEnv;
  });

  it("attaches invoice PDF when attachDocumentType is invoice", async () => {
    const result = await sendInterventionEmail({
      interventionId: "iv-1",
      companyId: "co-1",
      to: "client@example.com",
      subject: "Facture",
      bodyText: "Bonjour, ci-joint votre facture.",
      sentByUid: "uid-1",
      attachDocumentType: "invoice",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.attachmentFilename).toBe("facture-iv1.pdf");
    expect(mockBuildPdf).toHaveBeenCalledWith("iv-1", "invoice");
    expect(mockSendViaGmailApi).toHaveBeenCalledWith(
      expect.objectContaining({
        attachment: expect.objectContaining({ filename: "facture-iv1.pdf" }),
      }),
    );
  });

  it("defaults to invoice PDF when attachDocumentType omitted", async () => {
    await sendInterventionEmail({
      interventionId: "iv-2",
      companyId: "co-1",
      to: "a@b.co",
      subject: "Facture",
      bodyText: "Corps",
      sentByUid: "uid-1",
    });

    expect(mockBuildPdf).toHaveBeenCalledWith("iv-2", "invoice");
  });

  it("returns error when PDF generation fails (no silent send)", async () => {
    mockBuildPdf.mockRejectedValue(new Error("Intervention introuvable"));

    const result = await sendInterventionEmail({
      interventionId: "missing",
      companyId: "co-1",
      to: "a@b.co",
      subject: "Facture",
      bodyText: "Corps",
      sentByUid: "uid-1",
      attachDocumentType: "invoice",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/Impossible de joindre le PDF facture/i);
    expect(mockSendViaGmailApi).not.toHaveBeenCalled();
  });

  it("skips PDF when attachDocumentType is none", async () => {
    const result = await sendInterventionEmail({
      interventionId: "iv-3",
      companyId: "co-1",
      to: "a@b.co",
      subject: "Info",
      bodyText: "Sans PJ",
      sentByUid: "uid-1",
      attachDocumentType: "none",
    });

    expect(result.ok).toBe(true);
    expect(mockBuildPdf).not.toHaveBeenCalled();
    expect(mockSendViaGmailApi).toHaveBeenCalledWith(
      expect.objectContaining({ attachment: undefined }),
    );
  });
});
