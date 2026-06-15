import {
  decodeGmailBase64Url,
  decodeGmailBase64UrlToBuffer,
  extractMessageAttachments,
  extractMessageBodies,
  getMessageHeader,
  isPdfAttachment,
} from "@/core/services/email/gmailMessageBody";

describe("gmailMessageBody", () => {
  it("decodes base64url payloads", () => {
    const encoded = Buffer.from("Bonjour CRMSLOT", "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    expect(decodeGmailBase64Url(encoded)).toBe("Bonjour CRMSLOT");
  });

  it("reads headers and nested parts", () => {
    const message = {
      payload: {
        headers: [
          { name: "Subject", value: "Test" },
          { name: "From", value: "a@b.com" },
        ],
        parts: [
          {
            mimeType: "text/plain",
            body: {
              data: Buffer.from("ligne 1", "utf8")
                .toString("base64")
                .replace(/\+/g, "-")
                .replace(/\//g, "_"),
            },
          },
        ],
      },
    };
    expect(getMessageHeader(message, "subject")).toBe("Test");
    expect(extractMessageBodies(message).text).toBe("ligne 1");
  });

  it("collects attachment metadata from nested parts", () => {
    const message = {
      payload: {
        parts: [
          {
            mimeType: "multipart/mixed",
            parts: [
              {
                mimeType: "application/pdf",
                filename: "devis.pdf",
                body: { attachmentId: "att-1", size: 12000 },
              },
              {
                mimeType: "image/png",
                filename: "scan.png",
                body: { attachmentId: "att-2", size: 4000 },
              },
            ],
          },
        ],
      },
    };
    const attachments = extractMessageAttachments(message);
    expect(attachments).toHaveLength(2);
    expect(attachments[0].filename).toBe("devis.pdf");
    expect(isPdfAttachment(attachments[0])).toBe(true);
    expect(isPdfAttachment(attachments[1])).toBe(false);
  });

  it("decodes binary attachment payloads", () => {
    const raw = Buffer.from("%PDF-1.4", "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    expect(decodeGmailBase64UrlToBuffer(raw).toString("utf8")).toBe("%PDF-1.4");
  });
});
