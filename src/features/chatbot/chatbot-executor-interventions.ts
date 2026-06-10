import { buildAssignInterventionToTechnicianUpdate } from "@/features/interventions/assignInterventionToTechnician";
import { invalidateInterventionCache } from "@/features/chatbot/chatbot-intervention-source";
import { sendInterventionEmail } from "@/core/services/email/sendInterventionEmail";
import { resolveSendInterventionEmailAttachType } from "@/features/chatbot/chatbot-email-attach";
import { persistInterventionClientEmail } from "@/features/chatbot/chatbot-client-email";
import {
  db,
  clientLabel,
  assertInterventionAccess,
} from "@/features/chatbot/chatbot-executor-queries";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";

export async function updateInterventionStatus(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>
) {
  const interventionId = String(input.interventionId || "").trim();
  const status = String(input.status || "").trim();
  if (!interventionId || !status) throw new Error("interventionId et status requis");

  await assertInterventionAccess(ctx.companyId, interventionId);
  const now = new Date().toISOString();
  await db()
    .collection("interventions")
    .doc(interventionId)
    .update({ status, statusUpdatedAt: now });

  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (note) {
    await db()
      .collection("interventions")
      .doc(interventionId)
      .collection("timeline_events")
      .add({
        interventionId,
        type: "comment",
        content: `[Chatbot] ${note}`,
        visibility: "internal",
        createdAt: now,
        createdByUid: ctx.actorUid,
        companyId: ctx.companyId,
      });
  }

  return { ok: true, interventionId, status };
}

export async function assignTechnician(ctx: ChatbotToolContext, input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  const technicianUid = String(input.technicianUid || "").trim();
  if (!interventionId || !technicianUid) throw new Error("interventionId et technicianUid requis");

  const doc = await assertInterventionAccess(ctx.companyId, interventionId);
  const data = doc.data()!;
  const scheduledDate = String(input.scheduledDate || "").trim();
  const scheduledTime = String(input.scheduledTime || "").trim();
  const patch = buildAssignInterventionToTechnicianUpdate(
    data as Parameters<typeof buildAssignInterventionToTechnicianUpdate>[0],
    technicianUid,
    new Date(),
    scheduledDate && scheduledTime ? { scheduledDate, scheduledTime } : undefined
  );

  await db()
    .collection("interventions")
    .doc(interventionId)
    .update({
      ...patch,
      statusUpdatedAt: new Date().toISOString(),
    });

  return { ok: true, interventionId, ...patch };
}

export async function updateSchedule(ctx: ChatbotToolContext, input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  const scheduledDate = String(input.scheduledDate || "").trim();
  const scheduledTime = String(input.scheduledTime || "").trim();
  if (!interventionId || !scheduledDate || !scheduledTime) {
    throw new Error("interventionId, scheduledDate et scheduledTime requis");
  }

  await assertInterventionAccess(ctx.companyId, interventionId);
  await db().collection("interventions").doc(interventionId).update({
    scheduledDate,
    scheduledTime,
    statusUpdatedAt: new Date().toISOString(),
  });

  return { ok: true, interventionId, scheduledDate, scheduledTime };
}

export async function addTimelineComment(ctx: ChatbotToolContext, input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  const content = String(input.content || "").trim();
  if (!interventionId || !content) throw new Error("interventionId et content requis");

  await assertInterventionAccess(ctx.companyId, interventionId);
  const now = new Date().toISOString();
  const ref = await db()
    .collection("interventions")
    .doc(interventionId)
    .collection("timeline_events")
    .add({
      interventionId,
      type: "comment",
      content: `[Chatbot] ${content}`,
      visibility: "internal",
      createdAt: now,
      createdByUid: ctx.actorUid,
      companyId: ctx.companyId,
    });

  return { ok: true, eventId: ref.id };
}

export async function saveClientEmailFromChatbot(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>
) {
  const interventionId = String(input.interventionId || "").trim();
  const email = String(input.email || input.to || "").trim();
  if (!interventionId) throw new Error("interventionId requis");
  if (!email) throw new Error("email requis");

  const doc = await assertInterventionAccess(ctx.companyId, interventionId);
  const saved = await persistInterventionClientEmail(
    db(),
    ctx.companyId,
    interventionId,
    email,
    doc.data()!
  );
  invalidateInterventionCache(ctx.companyId);

  return {
    ok: true,
    interventionId,
    email: saved.email,
    savedOnIntervention: saved.savedOnIntervention,
    savedOnClient: saved.savedOnClient,
    clientName: clientLabel(doc.data()!),
  };
}

export async function sendInterventionEmailFromChatbot(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>
) {
  const interventionId = String(input.interventionId || "").trim();
  const to = String(input.to || "").trim();
  const subject = String(input.subject || "").trim();
  const bodyText = String(input.bodyText || "").trim();
  if (!interventionId || !to || !subject || !bodyText) {
    throw new Error("interventionId, to, subject et bodyText requis");
  }

  const doc = await assertInterventionAccess(ctx.companyId, interventionId);
  const data = doc.data()!;

  const attachDocumentType = resolveSendInterventionEmailAttachType(input, ctx.lastUserText);
  input.attachDocumentType = attachDocumentType;

  const result = await sendInterventionEmail({
    interventionId,
    companyId: ctx.companyId,
    to,
    subject,
    bodyText,
    inReplyTo: typeof input.inReplyTo === "string" ? input.inReplyTo.trim() : undefined,
    sentByUid: ctx.actorUid,
    sentVia: "chatbot",
    attachDocumentType,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  const saved = await persistInterventionClientEmail(db(), ctx.companyId, interventionId, to, data);
  invalidateInterventionCache(ctx.companyId);

  return {
    ok: true,
    interventionId,
    to,
    subject,
    messageId: result.messageId,
    attachDocumentType,
    attachmentFilename: result.attachmentFilename ?? null,
    emailSaved: saved.savedOnIntervention || saved.savedOnClient,
    savedOnCrm: saved.savedOnClient,
  };
}
