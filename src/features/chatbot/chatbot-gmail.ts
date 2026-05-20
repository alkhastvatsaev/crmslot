import { createGmailApiClient } from "@/core/services/email/gmailApiClient";
import {
  isGmailOAuthConfigured,
  resolveGmailOAuthConfig,
} from "@/core/services/email/gmailOAuthConfig";
import {
  extractMessageAttachments,
  extractMessageBodies,
  getMessageHeader,
} from "@/core/services/email/gmailMessageBody";
import { mapGmailMessageSummary } from "@/features/gmail/gmailHubMappers";

const MAX_LIST = 20;
const MAX_BODY_CHARS = 4500;

async function assertGmailReady(): Promise<void> {
  if (!(await isGmailOAuthConfigured())) {
    throw new Error(
      "Gmail non connecté : connectez Gmail depuis la page 7 (bouton Google) ou configurez OAuth côté serveur.",
    );
  }
}

/** Liste les mails récents de la boîte connectée (même compte que la page 7). */
export async function listGmailInboxForChatbot(input: {
  q?: string;
  labelId?: string;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<{
  mailbox: string | null;
  query: string | null;
  messages: Array<{
    id: string;
    threadId: string;
    from: string;
    subject: string;
    date: string;
    snippet: string;
    isUnread: boolean;
    labelIds: string[];
  }>;
  hint: string;
}> {
  await assertGmailReady();
  const gmail = await createGmailApiClient();
  const limit = Math.min(MAX_LIST, Math.max(1, Number(input.limit) || 12));
  const qParts: string[] = [];
  if (input.unreadOnly) qParts.push("is:unread");
  if (input.q?.trim()) qParts.push(input.q.trim());
  const q = qParts.length > 0 ? qParts.join(" ") : undefined;

  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: input.labelId?.trim() ? [input.labelId.trim()] : undefined,
    q,
    maxResults: limit,
  });

  const stubs = (listRes.data.messages ?? []).filter((s) => !!s.id);
  const messages = [];
  for (const stub of stubs) {
    const msgRes = await gmail.users.messages.get({
      userId: "me",
      id: stub.id!,
      format: "metadata",
      metadataHeaders: ["From", "To", "Subject", "Date"],
    });
    const mapped = mapGmailMessageSummary(msgRes.data);
    messages.push({
      id: mapped.id,
      threadId: mapped.threadId,
      from: mapped.from,
      subject: mapped.subject,
      date: mapped.date,
      snippet: mapped.snippet,
      isUnread: mapped.isUnread,
      labelIds: mapped.labelIds,
    });
  }

  const { senderEmail } = await resolveGmailOAuthConfig();
  return {
    mailbox: senderEmail ?? null,
    query: q ?? null,
    messages,
    hint:
      "Pour le détail (colis, infos client, corps du mail), appelez get_gmail_message avec id. Exemples de recherche q : « colis OR colissimo OR bpost », « from:client@example.com », « is:unread ».",
  };
}

/** Détail d'un mail Gmail (corps texte + pièces jointes). */
export async function getGmailMessageForChatbot(messageId: string): Promise<{
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  bodyText: string;
  snippet: string;
  isUnread: boolean;
  labelIds: string[];
  attachments: Array<{ filename: string; mimeType: string; size: number }>;
  hint: string;
}> {
  await assertGmailReady();
  const id = messageId.trim();
  if (!id) throw new Error("messageId requis");

  const gmail = await createGmailApiClient();
  const res = await gmail.users.messages.get({
    userId: "me",
    id,
    format: "full",
  });
  const data = res.data;
  const bodies = extractMessageBodies(data);
  const bodyText = (bodies.text || bodies.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || data.snippet || "").slice(
    0,
    MAX_BODY_CHARS,
  );

  const attachments = extractMessageAttachments(data).map((a) => ({
    filename: a.filename,
    mimeType: a.mimeType,
    size: a.size,
  }));

  return {
    id: data.id ?? id,
    threadId: data.threadId ?? "",
    from: getMessageHeader(data, "From"),
    to: getMessageHeader(data, "To"),
    subject: getMessageHeader(data, "Subject"),
    date: getMessageHeader(data, "Date"),
    bodyText,
    snippet: data.snippet ?? "",
    isUnread: (data.labelIds ?? []).includes("UNREAD"),
    labelIds: data.labelIds ?? [],
    attachments,
    hint: "Utilisez ces infos pour répondre au client ou mettre à jour le dossier intervention.",
  };
}
