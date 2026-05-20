import type { gmail_v1 } from "googleapis";

export function decodeGmailBase64Url(data: string): string {
  return decodeGmailBase64UrlToBuffer(data).toString("utf-8");
}

export function decodeGmailBase64UrlToBuffer(data: string): Buffer {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64");
}

export type GmailMessageAttachmentMeta = {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
};

function headerValue(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string,
): string {
  const key = name.toLowerCase();
  return headers?.find((h) => h.name?.toLowerCase() === key)?.value?.trim() ?? "";
}

export function getMessageHeader(
  message: gmail_v1.Schema$Message,
  name: string,
): string {
  return headerValue(message.payload?.headers, name);
}

function collectParts(
  part: gmail_v1.Schema$MessagePart | undefined,
  textChunks: string[],
  htmlChunks: string[],
): void {
  if (!part) return;
  const mime = part.mimeType?.toLowerCase() ?? "";
  if (part.body?.data) {
    const decoded = decodeGmailBase64Url(part.body.data);
    if (mime.includes("text/plain")) textChunks.push(decoded);
    else if (mime.includes("text/html")) htmlChunks.push(decoded);
  }
  for (const child of part.parts ?? []) {
    collectParts(child, textChunks, htmlChunks);
  }
}

export function extractMessageBodies(message: gmail_v1.Schema$Message): {
  text: string;
  html: string;
} {
  const textChunks: string[] = [];
  const htmlChunks: string[] = [];
  collectParts(message.payload, textChunks, htmlChunks);
  return {
    text: textChunks.join("\n\n").trim(),
    html: htmlChunks.join("\n\n").trim(),
  };
}

function collectAttachments(
  part: gmail_v1.Schema$MessagePart | undefined,
  out: GmailMessageAttachmentMeta[],
): void {
  if (!part) return;
  const attachmentId = part.body?.attachmentId?.trim();
  const filename = part.filename?.trim();
  if (attachmentId && filename) {
    out.push({
      attachmentId,
      filename,
      mimeType: (part.mimeType ?? "application/octet-stream").toLowerCase(),
      size: part.body?.size ?? 0,
    });
  }
  for (const child of part.parts ?? []) {
    collectAttachments(child, out);
  }
}

export function extractMessageAttachments(
  message: gmail_v1.Schema$Message,
): GmailMessageAttachmentMeta[] {
  const out: GmailMessageAttachmentMeta[] = [];
  collectAttachments(message.payload, out);
  return out;
}

export function isPdfAttachment(att: GmailMessageAttachmentMeta): boolean {
  if (att.mimeType.includes("pdf")) return true;
  return att.filename.toLowerCase().endsWith(".pdf");
}

export function encodeGmailRawMessage(raw: string): string {
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
