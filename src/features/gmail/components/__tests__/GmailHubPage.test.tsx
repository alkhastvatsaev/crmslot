import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithPager } from "@/test-utils/renderWithPager";
import GmailHubPage from "@/features/gmail/components/GmailHubPage";
import { GMAIL_HUB_SLOT_INDEX } from "@/features/gmail/gmailHubConstants";

const fetchMock = jest.fn();

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: (...args: unknown[]) => fetchMock(...args),
}));

describe("GmailHubPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/auth-url")) {
        return {
          ok: true,
          json: async () => ({ url: "https://accounts.google.com/o/oauth2/auth?test=1" }),
        };
      }
      if (url.includes("/status")) {
        return {
          ok: true,
          json: async () => ({
            oauthConfigured: true,
            oauthClientConfigured: true,
            smtpConfigured: false,
            email: "alkhastvatsaev@gmail.com",
          }),
        };
      }
      if (url.includes("/labels")) {
        return { ok: true, json: async () => ({ labels: [] }) };
      }
      if (url.includes("/messages?")) {
        return {
          ok: true,
          json: async () => ({
            messages: [
              {
                id: "m1",
                threadId: "t1",
                snippet: "Hello",
                from: "client@example.com",
                to: "alkhastvatsaev@gmail.com",
                subject: "Devis",
                date: "Mon, 1 Jan 2026 10:00:00 +0000",
                labelIds: ["INBOX", "UNREAD"],
                isUnread: true,
              },
            ],
            nextPageToken: null,
          }),
        };
      }
      if (url.includes("/threads/t1")) {
        return {
          ok: true,
          json: async () => ({
            threadId: "t1",
            messages: [
              {
                id: "m1",
                threadId: "t1",
                snippet: "Hello",
                from: "client@example.com",
                to: "alkhastvatsaev@gmail.com",
                subject: "Devis",
                date: "Mon, 1 Jan 2026 10:00:00 +0000",
                labelIds: ["INBOX"],
                isUnread: false,
                bodyText: "Corps du mail",
                bodyHtml: "",
                messageIdHeader: "<m1@mail>",
                referencesHeader: "",
                attachments: [],
              },
            ],
          }),
        };
      }
      if (url.includes("/messages/m1")) {
        if (url.endsWith("/modify")) {
          return { ok: true, json: async () => ({ ok: true, labelIds: ["INBOX"] }) };
        }
        return {
          ok: true,
          json: async () => ({
            message: {
              id: "m1",
              threadId: "t1",
              snippet: "Hello",
              from: "client@example.com",
              to: "alkhastvatsaev@gmail.com",
              subject: "Devis",
              date: "Mon, 1 Jan 2026 10:00:00 +0000",
              labelIds: ["INBOX"],
              isUnread: false,
              bodyText: "Corps du mail",
              bodyHtml: "",
              messageIdHeader: "<m1@mail>",
              referencesHeader: "",
              attachments: [],
            },
          }),
        };
      }
      return { ok: false, json: async () => ({ error: "unexpected" }) };
    });
  });

  it("renders inbox list and message detail on slot 6", async () => {
    renderWithPager(<GmailHubPage />, GMAIL_HUB_SLOT_INDEX + 1);
    expect(screen.getByTestId(`dashboard-pager-slot-${GMAIL_HUB_SLOT_INDEX}`)).toBeInTheDocument();
    expect(await screen.findByTestId("gmail-hub-message-list")).toBeInTheDocument();
    expect(await screen.findByTestId("gmail-hub-row-m1")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("gmail-hub-row-m1"));
    expect(await screen.findByTestId("gmail-hub-detail")).toBeInTheDocument();
    expect(screen.getByTestId("gmail-hub-body-text")).toHaveTextContent("Corps du mail");
    expect(screen.getByTestId("gmail-hub-page")).toHaveClass("gmail-hub-page-root");
    expect(screen.getByTestId("gmail-hub-page")).not.toHaveClass("gmail-hub-page-root--reading");
    expect(screen.getByTestId("gmail-hub-disconnect-btn")).toBeInTheDocument();
  });

  it("opens PDF in the full right panel with close button", async () => {
    const pdfBase64 = Buffer.from("%PDF-1.4", "utf8").toString("base64");
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/status")) {
        return {
          ok: true,
          json: async () => ({
            oauthConfigured: true,
            oauthClientConfigured: true,
            email: "alkhastvatsaev@gmail.com",
          }),
        };
      }
      if (url.includes("/labels")) {
        return { ok: true, json: async () => ({ labels: [] }) };
      }
      if (url.includes("/messages?")) {
        return {
          ok: true,
          json: async () => ({
            messages: [
              {
                id: "m2",
                threadId: "t2",
                snippet: "PDF",
                from: "client@example.com",
                subject: "Facture",
                date: "Mon, 1 Jan 2026 10:00:00 +0000",
                labelIds: ["INBOX"],
                isUnread: false,
              },
            ],
            nextPageToken: null,
          }),
        };
      }
      if (url.includes("/threads/t2")) {
        return {
          ok: true,
          json: async () => ({
            threadId: "t2",
            messages: [
              {
                id: "m2",
                threadId: "t2",
                snippet: "PDF",
                from: "client@example.com",
                to: "me@test.com",
                subject: "Facture",
                date: "Mon, 1 Jan 2026 10:00:00 +0000",
                labelIds: ["INBOX"],
                isUnread: false,
                bodyText: "Voir PJ",
                bodyHtml: "",
                messageIdHeader: "<m2@mail>",
                referencesHeader: "",
                attachments: [
                  {
                    attachmentId: "att-pdf",
                    filename: "facture.pdf",
                    mimeType: "application/pdf",
                    size: 8000,
                  },
                ],
              },
            ],
          }),
        };
      }
      if (url.includes("/attachments/")) {
        return {
          ok: true,
          json: async () => ({
            dataBase64: pdfBase64,
            mimeType: "application/pdf",
            filename: "facture.pdf",
          }),
        };
      }
      if (url.includes("/messages/m2")) {
        return { ok: true, json: async () => ({ message: {} }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    global.URL.createObjectURL = jest.fn(() => "blob:mock-facture");
    global.URL.revokeObjectURL = jest.fn();

    renderWithPager(<GmailHubPage />, GMAIL_HUB_SLOT_INDEX + 1);
    fireEvent.click(await screen.findByTestId("gmail-hub-row-m2"));
    await screen.findByTestId("gmail-hub-attachment-att-pdf");
    fireEvent.click(screen.getByTestId("gmail-hub-attachment-att-pdf"));
    await waitFor(() => {
      expect(screen.getByTestId("gmail-hub-pdf-panel")).toBeInTheDocument();
      expect(screen.getByTestId("gmail-hub-pdf-iframe")).toHaveAttribute("src", "blob:mock-facture");
    });
    expect(screen.queryByTestId("gmail-hub-detail")).not.toBeInTheDocument();
    expect(screen.getByTestId("gmail-hub-pdf-close")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("gmail-hub-pdf-close"));
    expect(await screen.findByTestId("gmail-hub-detail")).toBeInTheDocument();
    expect(screen.queryByTestId("gmail-hub-pdf-panel")).not.toBeInTheDocument();
  });

  it("shows connect button when client is configured but refresh token is missing", async () => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/auth-url")) {
        return { ok: true, json: async () => ({ url: "https://accounts.google.com/o/oauth2/auth?test=1" }) };
      }
      if (url.includes("/status")) {
        return {
          ok: true,
          json: async () => ({
            oauthConfigured: false,
            oauthClientConfigured: true,
            smtpConfigured: false,
            email: "alkhastvatsaev@gmail.com",
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });
    renderWithPager(<GmailHubPage />, GMAIL_HUB_SLOT_INDEX + 1);
    expect(await screen.findByTestId("gmail-hub-connect-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("gmail-hub-missing-client")).not.toBeInTheDocument();
  });

  it("shows setup when OAuth is missing", async () => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/auth-url")) {
        return { ok: true, json: async () => ({ url: "https://accounts.google.com/o/oauth2/auth?test=1" }) };
      }
      if (url.includes("/status")) {
        return {
          ok: true,
          json: async () => ({
            oauthConfigured: false,
            oauthClientConfigured: true,
            smtpConfigured: false,
            email: null,
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });
    renderWithPager(<GmailHubPage />, GMAIL_HUB_SLOT_INDEX + 1);
    expect(await screen.findByTestId("gmail-hub-setup")).toBeInTheDocument();
    expect(screen.getByTestId("gmail-hub-connect-btn")).toBeInTheDocument();
  });
});
