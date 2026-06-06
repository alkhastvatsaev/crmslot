import { gmail } from "@googleapis/gmail";
import { OAuth2Client } from "google-auth-library";
import { buildMimeMultipartEmail, type MimeAttachment } from "@/core/services/email/buildMimeEmail";
import { resolveGmailOAuthConfig } from "@/core/services/email/gmailOAuthConfig";

export type GmailApiSendParams = {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  messageId: string;
  replyTo: string;
  inReplyTo?: string;
  references?: string;
  attachment?: MimeAttachment;
};

function encodeSubjectUtf8(subject: string): string {
  const b64 = Buffer.from(subject, "utf8").toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}

function buildRfc822Raw(params: GmailApiSendParams, fromEmail: string, fromName: string): string {
  const html = params.bodyHtml ?? `<p>${params.bodyText.replace(/\n/g, "<br>")}</p>`;
  if (params.attachment) {
    return buildMimeMultipartEmail({
      fromEmail,
      fromName,
      to: params.to,
      subject: params.subject,
      bodyHtml: html,
      messageId: params.messageId,
      replyTo: params.replyTo,
      inReplyTo: params.inReplyTo,
      references: params.references,
      attachment: params.attachment,
    });
  }
  const lines = [
    `From: "${fromName}" <${fromEmail}>`,
    `To: ${params.to}`,
    `Subject: ${encodeSubjectUtf8(params.subject)}`,
    `Reply-To: ${params.replyTo}`,
    `Message-ID: ${params.messageId}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    ...(params.inReplyTo ? [`In-Reply-To: ${params.inReplyTo}`] : []),
    ...(params.references ? [`References: ${params.references}`] : []),
    "",
    Buffer.from(html, "utf8").toString("base64"),
  ];
  return lines.join("\r\n");
}

export async function sendViaGmailApi(params: GmailApiSendParams): Promise<void> {
  const { clientId, clientSecret, redirectUri, refreshToken, senderEmail } =
    await resolveGmailOAuthConfig();
  if (!clientId || !clientSecret || !refreshToken || !senderEmail) {
    throw new Error(
      "OAuth Gmail incomplet (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_USER)."
    );
  }

  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "MAP BELGIQUE";
  const oauth2 = new OAuth2Client(clientId, clientSecret, redirectUri);
  oauth2.setCredentials({ refresh_token: refreshToken });

  const gmailClient = gmail({ version: "v1", auth: oauth2 });
  const raw = buildRfc822Raw(params, senderEmail, fromName);
  const encoded = Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmailClient.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });
}
