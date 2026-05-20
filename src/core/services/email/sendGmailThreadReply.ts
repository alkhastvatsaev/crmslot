import type { gmail_v1 } from "googleapis";
import { createGmailApiClient } from "@/core/services/email/gmailApiClient";
import {
  encodeGmailRawMessage,
  getMessageHeader,
} from "@/core/services/email/gmailMessageBody";
import { resolveGmailOAuthConfig } from "@/core/services/email/gmailOAuthConfig";

function encodeSubjectUtf8(subject: string): string {
  const b64 = Buffer.from(subject, "utf8").toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}

export type SendGmailThreadReplyInput = {
  to: string;
  subject: string;
  bodyText: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
};

export type SendGmailThreadReplyResult = {
  ok: true;
  id: string | null;
  threadId: string | null;
  sentTo: string;
  subject: string;
};

/** Envoi Gmail dans un fil (In-Reply-To / References + threadId si disponible). */
export async function sendGmailThreadReply(
  input: SendGmailThreadReplyInput,
): Promise<SendGmailThreadReplyResult> {
  const to = input.to.trim();
  const subject = input.subject.trim();
  const bodyText = input.bodyText.trim();
  if (!to || !subject || !bodyText) {
    throw new Error("Champs requis : to, subject, bodyText.");
  }

  const { senderEmail } = await resolveGmailOAuthConfig();
  if (!senderEmail) throw new Error("GMAIL_USER / compte OAuth manquant.");

  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "MAP BELGIQUE";
  const messageId = `<${crypto.randomUUID()}@${senderEmail.split("@")[1] ?? "mapbelgique.com"}>`;
  const html = `<p>${bodyText.replace(/\n/g, "<br>")}</p>`;
  const lines = [
    `From: "${fromName}" <${senderEmail}>`,
    `To: ${to}`,
    `Subject: ${encodeSubjectUtf8(subject)}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    ...(input.inReplyTo ? [`In-Reply-To: ${input.inReplyTo}`] : []),
    ...(input.references ? [`References: ${input.references}`] : []),
    "",
    Buffer.from(html, "utf8").toString("base64"),
  ];
  const raw = encodeGmailRawMessage(lines.join("\r\n"));

  const gmail: gmail_v1.Gmail = await createGmailApiClient();
  const sent = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      ...(input.threadId ? { threadId: input.threadId } : {}),
    },
  });

  return {
    ok: true,
    id: sent.data.id ?? null,
    threadId: sent.data.threadId ?? input.threadId ?? null,
    sentTo: to,
    subject,
  };
}

/** Prépare une réponse à partir d'un message Gmail existant. */
export async function sendGmailReplyToMessage(input: {
  messageId: string;
  bodyText: string;
  to?: string;
  subject?: string;
}): Promise<SendGmailThreadReplyResult> {
  const id = input.messageId.trim();
  if (!id) throw new Error("messageId requis");

  const gmail = await createGmailApiClient();
  const orig = await gmail.users.messages.get({
    userId: "me",
    id,
    format: "metadata",
    metadataHeaders: ["From", "Subject", "Message-ID", "References"],
  });

  const from = getMessageHeader(orig.data, "From");
  const origSubject = getMessageHeader(orig.data, "Subject");
  const messageIdHeader = getMessageHeader(orig.data, "Message-ID");
  const referencesHeader = getMessageHeader(orig.data, "References");
  const threadId = orig.data.threadId ?? undefined;

  const to =
    input.to?.trim() ||
    from.match(/<([^>]+)>/)?.[1]?.trim() ||
    from.trim();
  const subject =
    input.subject?.trim() ||
    (origSubject.startsWith("Re:") ? origSubject : `Re: ${origSubject}`);

  const references = [referencesHeader, messageIdHeader].filter(Boolean).join(" ").trim() || undefined;

  return sendGmailThreadReply({
    to,
    subject,
    bodyText: input.bodyText,
    threadId,
    inReplyTo: messageIdHeader || undefined,
    references,
  });
}
