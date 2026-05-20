import {
  getGmailMessageForChatbot,
  linkGmailToIntervention,
  listGmailInboxForChatbot,
  sendGmailReplyFromChatbot,
  suggestGmailInterventionLinksForChatbot,
} from "@/features/chatbot/chatbot-gmail";

const messagesList = jest.fn();
const messagesGet = jest.fn();
const timelineAdd = jest.fn();
const interventionGet = jest.fn();

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

jest.mock("@/core/services/email/sendGmailThreadReply", () => ({
  sendGmailReplyToMessage: jest.fn().mockResolvedValue({
    ok: true,
    id: "sent1",
    threadId: "t-reply",
    sentTo: "client@example.com",
    subject: "Re: Infos chantier",
  }),
}));

jest.mock("@/features/chatbot/chatbot-intervention-source", () => ({
  fetchInterventionsForCompany: jest.fn().mockResolvedValue([
    {
      id: "iv-1",
      clientName: "Dupont",
      clientEmail: "client@example.com",
      status: "open",
    },
    {
      id: "iv-2",
      clientName: "Martin",
      clientEmail: "other@example.com",
      status: "done",
    },
  ]),
}));

jest.mock("@/core/config/firebase-admin", () => ({
  getAdminDb: jest.fn(() => ({
    collection: (name: string) => {
      if (name === "interventions") {
        return {
          doc: (id: string) => ({
            get: interventionGet,
            collection: (sub: string) => {
              if (sub === "timeline_events") {
                return { add: timelineAdd };
              }
              throw new Error(`unexpected sub ${sub}`);
            },
          }),
        };
      }
      throw new Error(`unexpected collection ${name}`);
    },
  })),
}));

describe("chatbot-gmail", () => {
  beforeEach(() => {
    messagesList.mockReset();
    messagesGet.mockReset();
    timelineAdd.mockReset();
    interventionGet.mockReset();
    interventionGet.mockResolvedValue({
      exists: true,
      data: () => ({ companyId: "co-1" }),
    });
    timelineAdd.mockResolvedValue({ id: "evt-1" });
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

  it("suggests intervention links by sender email", async () => {
    const bodyB64 = Buffer.from("Bonjour Dupont", "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    messagesGet.mockResolvedValue({
      data: {
        id: "m3",
        threadId: "t3",
        snippet: "Bonjour",
        labelIds: ["INBOX"],
        payload: {
          headers: [
            { name: "From", value: "Client <client@example.com>" },
            { name: "Subject", value: "Chantier" },
            { name: "Date", value: "Mon, 1 Jan 2026 12:00:00 +0000" },
          ],
          parts: [{ mimeType: "text/plain", body: { data: bodyB64 } }],
        },
      },
    });

    const result = await suggestGmailInterventionLinksForChatbot("co-1", { messageId: "m3" });
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.candidates[0].interventionId).toBe("iv-1");
    expect(result.candidates[0].reasons.join(" ")).toMatch(/email/i);
  });

  it("sends reply via shared thread helper", async () => {
    const { sendGmailReplyToMessage } = jest.requireMock(
      "@/core/services/email/sendGmailThreadReply",
    ) as { sendGmailReplyToMessage: jest.Mock };

    const result = await sendGmailReplyFromChatbot({
      messageId: "m2",
      bodyText: "RDV confirmé lundi.",
    });

    expect(sendGmailReplyToMessage).toHaveBeenCalledWith({
      messageId: "m2",
      bodyText: "RDV confirmé lundi.",
    });
    expect(result.ok).toBe(true);
    expect(result.sentTo).toBe("client@example.com");
    expect(result.threadId).toBe("t-reply");
  });

  it("links mail to intervention timeline_events", async () => {
    const bodyB64 = Buffer.from("Update colis", "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    messagesGet.mockResolvedValue({
      data: {
        id: "m4",
        threadId: "t4",
        snippet: "colis",
        labelIds: ["INBOX"],
        payload: {
          headers: [
            { name: "From", value: "client@example.com" },
            { name: "Subject", value: "Colis" },
            { name: "Date", value: "Mon, 1 Jan 2026 12:00:00 +0000" },
          ],
          parts: [{ mimeType: "text/plain", body: { data: bodyB64 } }],
        },
      },
    });

    const result = await linkGmailToIntervention(
      { companyId: "co-1", actorUid: "uid-1" },
      { messageId: "m4", interventionId: "iv-1", note: "Mail client" },
    );

    expect(result.ok).toBe(true);
    expect(result.eventId).toBe("evt-1");
    expect(timelineAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "gmail_link",
        gmailMessageId: "m4",
        interventionId: "iv-1",
        companyId: "co-1",
      }),
    );
  });
});
