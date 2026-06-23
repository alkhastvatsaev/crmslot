import { sendGmailReplyToMessage } from "@/core/services/email/sendGmailThreadReply";
import { assertGmailReady } from "@/features/chatbot/chatbot-gmail-shared";

/** Répond à un mail Gmail depuis le chatbot (fil de discussion). */
export async function sendGmailReplyFromChatbot(input: {
  messageId: string;
  bodyText: string;
  to?: string;
  subject?: string;
}): Promise<{ ok: boolean; sentTo: string; subject: string; threadId: string | null }> {
  await assertGmailReady();
  const sent = await sendGmailReplyToMessage(input);
  return {
    ok: true,
    sentTo: sent.sentTo,
    subject: sent.subject,
    threadId: sent.threadId,
  };
}
