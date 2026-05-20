export type MimeAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

function encodeSubjectUtf8(subject: string): string {
  const b64 = Buffer.from(subject, "utf8").toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}

function chunkBase64(str: string): string {
  return str.match(/.{1,76}/g)?.join("\r\n") || "";
}

/** RFC 822 multipart/mixed (HTML + pièce jointe). */
export function buildMimeMultipartEmail(params: {
  fromEmail: string;
  fromName: string;
  to: string;
  subject: string;
  bodyHtml: string;
  messageId: string;
  replyTo: string;
  inReplyTo?: string;
  references?: string;
  attachment: MimeAttachment;
}): string {
  const boundary = `belgmap_${crypto.randomUUID().replace(/-/g, "")}`;
  const htmlB64 = chunkBase64(Buffer.from(params.bodyHtml, "utf8").toString("base64"));
  const attachB64 = chunkBase64(params.attachment.content.toString("base64"));

  const headers = [
    `From: "${params.fromName}" <${params.fromEmail}>`,
    `To: ${params.to}`,
    `Subject: ${encodeSubjectUtf8(params.subject)}`,
    `Reply-To: ${params.replyTo}`,
    `Message-ID: ${params.messageId}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ...(params.inReplyTo ? [`In-Reply-To: ${params.inReplyTo}`] : []),
    ...(params.references ? [`References: ${params.references}`] : []),
  ];

  const parts = [
    ...headers,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    htmlB64,
    `--${boundary}`,
    `Content-Type: ${params.attachment.contentType}; name="${params.attachment.filename}"`,
    `Content-Disposition: attachment; filename="${params.attachment.filename}"`,
    "Content-Transfer-Encoding: base64",
    "",
    attachB64,
    `--${boundary}--`,
    "",
  ];

  return parts.join("\r\n");
}
