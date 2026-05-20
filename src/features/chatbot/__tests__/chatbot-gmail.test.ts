import {
  getGmailMessageForChatbot,
  listGmailInboxForChatbot,
} from "@/features/chatbot/chatbot-gmail";

const messagesList = jest.fn();
const messagesGet = jest.fn();

jest.mock("@/core/services/email/gmailApiClient", () => ({
  createGmailApiClient: jest.fn().mockResolvedValue({
    users: {
      messages: {
        list: (...args: unknown[]) => messagesList(...args),
        get: (...args: unknown[]) => messagesGet(...args),
      },
    },
  }),
}));

jest.mock("@/core/services/email/gmailOAuthConfig", () => ({
  isGmailOAuthConfigured: jest.fn().mockResolvedValue(true),
  resolveGmailOAuthConfig: jest.fn().mockResolvedValue({ senderEmail: "alkhastvatsaev@gmail.com" }),
}));

describe("chatbot-gmail", () => {
  beforeEach(() => {
    messagesList.mockReset();
    messagesGet.mockReset();
  });

  it("lists inbox summaries with optional query", async () => {
    messagesList.mockResolvedValue({
      data: { messages: [{ id: "m1" }] },
    });
    messagesGet.mockResolvedValue({
      data: {
        id: "m1",
        threadId: "t1",
        snippet: "Colis en route",
        labelIds: ["INBOX", "UNREAD"],
        payload: {
          headers: [
            { name: "From", value: "colis@bpost.be" },
            { name: "Subject", value: "Votre colis" },
            { name: "Date", value: "Mon, 1 Jan 2026 12:00:00 +0000" },
          ],
        },
      },
    });

    const result = await listGmailInboxForChatbot({ q: "colis", unreadOnly: true, limit: 5 });
    expect(result.mailbox).toBe("alkhastvatsaev@gmail.com");
    expect(result.query).toContain("is:unread");
    expect(result.query).toContain("colis");
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].subject).toBe("Votre colis");
  });

  it("returns message body and attachments", async () => {
    const bodyB64 = Buffer.from("Numéro suivi : BE123", "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    messagesGet.mockResolvedValue({
      data: {
        id: "m2",
        threadId: "t2",
        snippet: "suivi",
        labelIds: ["INBOX"],
        payload: {
          headers: [
            { name: "From", value: "client@example.com" },
            { name: "To", value: "me@test.com" },
            { name: "Subject", value: "Infos chantier" },
            { name: "Date", value: "Mon, 1 Jan 2026 12:00:00 +0000" },
          ],
          parts: [
            {
              mimeType: "text/plain",
              body: { data: bodyB64 },
            },
            {
              mimeType: "application/pdf",
              filename: "plan.pdf",
              body: { attachmentId: "att1", size: 9000 },
            },
          ],
        },
      },
    });

    const detail = await getGmailMessageForChatbot("m2");
    expect(detail.bodyText).toContain("BE123");
    expect(detail.attachments).toHaveLength(1);
    expect(detail.attachments[0].filename).toBe("plan.pdf");
  });
});
