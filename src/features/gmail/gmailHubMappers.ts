import type { gmail_v1 } from "@googleapis/gmail";
import {
  extractMessageAttachments,
  extractMessageBodies,
  getMessageHeader,
} from "@/core/services/email/gmailMessageBody";
import type {
  GmailHubLabel,
  GmailHubMessageDetail,
  GmailHubMessageSummary,
} from "@/features/gmail/gmailHubTypes";

export function mapGmailLabel(label: gmail_v1.Schema$Label): GmailHubLabel {
  return {
    id: label.id ?? "",
    name: label.name ?? "",
    type: label.type ?? "user",
    messagesTotal: label.messagesTotal ?? 0,
    messagesUnread: label.messagesUnread ?? 0,
  };
}

export function mapGmailMessageSummary(message: gmail_v1.Schema$Message): GmailHubMessageSummary {
  const labelIds = message.labelIds ?? [];
  return {
    id: message.id ?? "",
    threadId: message.threadId ?? "",
    snippet: message.snippet ?? "",
    from: getMessageHeader(message, "From"),
    to: getMessageHeader(message, "To"),
    subject: getMessageHeader(message, "Subject") || "(sans objet)",
    date: getMessageHeader(message, "Date"),
    labelIds,
    isUnread: labelIds.includes("UNREAD"),
  };
}

export function mapGmailMessageDetail(message: gmail_v1.Schema$Message): GmailHubMessageDetail {
  const bodies = extractMessageBodies(message);
  const summary = mapGmailMessageSummary(message);
  return {
    ...summary,
    bodyText: bodies.text || message.snippet || "",
    bodyHtml: bodies.html,
    messageIdHeader: getMessageHeader(message, "Message-ID"),
    referencesHeader: getMessageHeader(message, "References"),
    attachments: extractMessageAttachments(message).map((a) => ({
      attachmentId: a.attachmentId,
      filename: a.filename,
      mimeType: a.mimeType,
      size: a.size,
    })),
  };
}
