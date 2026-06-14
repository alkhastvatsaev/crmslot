/** @jest-environment node */

const mockSendInterventionEmail = jest.fn();
const mockEnsurePortalAccessTokenAdmin = jest.fn();
const mockIsGmailConfigured = jest.fn();

jest.mock("@/core/services/email/sendInterventionEmail", () => ({
  isGmailConfigured: () => mockIsGmailConfigured(),
  sendInterventionEmail: (...args: unknown[]) => mockSendInterventionEmail(...args),
}));

jest.mock("@/features/interventions/server/ensurePortalAccessTokenAdmin", () => ({
  ensurePortalAccessTokenAdmin: (...args: unknown[]) => mockEnsurePortalAccessTokenAdmin(...args),
}));

jest.mock("@/core/config/publicAppUrl", () => ({
  buildPortalSuiviUrl: (token: string) => `https://app.test/suivi/${token}`,
}));

import { notifyPortalAccessAdmin } from "@/features/interventions/server/portalAccessNotifyAdmin";

describe("notifyPortalAccessAdmin", () => {
  const db = {
    collection: () => ({
      doc: () => ({
        update: jest.fn().mockResolvedValue(undefined),
      }),
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsGmailConfigured.mockReturnValue(true);
    mockEnsurePortalAccessTokenAdmin.mockResolvedValue("portal-token-abc");
    mockSendInterventionEmail.mockResolvedValue({ ok: true, messageId: "<msg@test>" });
  });

  it("sends welcome email without invoice PDF attachment", async () => {
    const result = await notifyPortalAccessAdmin({
      db: db as never,
      interventionId: "iv-icloud",
      iv: {
        id: "iv-icloud",
        companyId: "co-1",
        clientEmail: "alkhastvatsaev@icloud.com",
        clientFirstName: "Ali",
        portalAccessCode: "AB12CD34",
        title: "Porte bloquée",
        createdByUid: "client-uid",
      } as never,
    });

    expect(result.emailSent).toBe(true);
    expect(mockSendInterventionEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alkhastvatsaev@icloud.com",
        sentVia: "portal_access_welcome",
        attachDocumentType: "none",
      })
    );
  });

  it("returns emailSent false when Gmail send fails", async () => {
    mockSendInterventionEmail.mockResolvedValue({ ok: false, error: "SMTP rejected" });

    const result = await notifyPortalAccessAdmin({
      db: db as never,
      interventionId: "iv-2",
      iv: {
        id: "iv-2",
        companyId: "co-1",
        clientEmail: "alkhastvatsaev@icloud.com",
        portalAccessCode: "XY99ZZ11",
        title: "Serrure",
        createdByUid: "client-uid",
      } as never,
    });

    expect(result.emailSent).toBe(false);
  });
});
