import { buildMimeMultipartEmail } from "@/core/services/email/buildMimeEmail";

describe("buildMimeMultipartEmail", () => {
  it("includes pdf attachment part", () => {
    const raw = buildMimeMultipartEmail({
      fromEmail: "test@gmail.com",
      fromName: "Test",
      to: "client@example.com",
      subject: "Facture",
      bodyHtml: "<p>Bonjour</p>",
      messageId: "<id@test.com>",
      replyTo: "reply@test.com",
      attachment: {
        filename: "facture-abc.pdf",
        content: Buffer.from("%PDF-1.4 test"),
        contentType: "application/pdf",
      },
    });
    expect(raw).toContain("multipart/mixed");
    expect(raw).toContain("facture-abc.pdf");
    expect(raw).toContain("application/pdf");
    expect(raw).toContain("Content-Disposition: attachment");
  });
});
