import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/core/config/firebase-admin";
import {
  assertGmailReady,
  assertInterventionAccess,
  parseSenderEmail,
} from "@/features/chatbot/chatbot-gmail-shared";
import { getGmailMessageForChatbot } from "@/features/chatbot/chatbot-gmail-inbox";

/** Lie un mail Gmail à une intervention (timeline Firestore). */
export async function linkGmailToIntervention(
  ctx: { companyId: string; actorUid: string },
  input: { messageId: string; interventionId: string; note?: string }
): Promise<{
  ok: boolean;
  interventionId: string;
  from: string;
  subject: string;
  eventId: string;
}> {
  await assertGmailReady();
  const messageId = input.messageId.trim();
  const interventionId = input.interventionId.trim();
  if (!messageId || !interventionId) {
    throw new Error("messageId et interventionId requis");
  }

  await assertInterventionAccess(ctx.companyId, interventionId);

  const detail = await getGmailMessageForChatbot(messageId);
  const senderEmail = parseSenderEmail(detail.from);
  const excerpt = detail.bodyText.slice(0, 500);

  const ref = await getAdminDb()
    .collection("interventions")
    .doc(interventionId)
    .collection("timeline_events")
    .add({
      interventionId,
      type: "gmail_link",
      gmailMessageId: messageId,
      gmailThreadId: detail.threadId || null,
      from: detail.from,
      senderEmail: senderEmail || null,
      subject: detail.subject,
      date: detail.date,
      excerpt,
      note: input.note?.trim() || null,
      visibility: "internal",
      createdAt: new Date().toISOString(),
      createdByUid: ctx.actorUid,
      companyId: ctx.companyId,
      linkedAt: FieldValue.serverTimestamp(),
    });

  return {
    ok: true,
    interventionId,
    from: detail.from,
    subject: detail.subject,
    eventId: ref.id,
  };
}
