import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/core/config/firebase-admin";
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
import { sendGmailReplyToMessage } from "@/core/services/email/sendGmailThreadReply";
import { fetchInterventionsForCompany } from "@/features/chatbot/chatbot-intervention-source";
import { interventionSearchHaystack } from "@/features/chatbot/chatbot-workspace-search";
import { mapGmailMessageSummary } from "@/features/gmail/gmailHubMappers";

const MAX_LIST = 20;
const MAX_BODY_CHARS = 4500;

async function assertGmailReady(): Promise<void> {
  if (!(await isGmailOAuthConfigured())) {
    throw new Error(
      "Gmail non connecté : connectez Gmail depuis la page 6 (bouton Google) ou configurez OAuth côté serveur.",
    );
  }
}

function parseSenderEmail(from: string): string {
  return from.match(/<([^>]+)>/)?.[1]?.trim().toLowerCase() || from.trim().toLowerCase();
}

async function assertInterventionAccess(companyId: string, interventionId: string) {
  const doc = await getAdminDb().collection("interventions").doc(interventionId).get();
  if (!doc.exists) throw new Error("Intervention introuvable");
  if (String(doc.data()?.companyId || "") !== companyId) {
    throw new Error("Accès refusé (autre société)");
  }
}

/** Liste les mails récents de la boîte connectée (même compte que la page 6). */
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
      "Pour le détail, appelez get_gmail_message. Pour lier à un dossier : suggest_gmail_intervention_links puis link_gmail_to_intervention. Pour répondre : send_gmail_reply (confirmation requise).",
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
    hint: "Utilisez suggest_gmail_intervention_links pour proposer des dossiers, send_gmail_reply pour répondre (avec confirmation).",
  };
}

/** Propose des dossiers intervention à lier à un mail (lecture seule). */
export async function suggestGmailInterventionLinksForChatbot(
  companyId: string,
  input: { messageId: string },
): Promise<{
  messageId: string;
  from: string;
  subject: string;
  senderEmail: string | null;
  candidates: Array<{
    interventionId: string;
    clientName: string;
    status: string | null;
    score: number;
    reasons: string[];
  }>;
  hint: string;
}> {
  await assertGmailReady();
  const msg = await getGmailMessageForChatbot(input.messageId);
  const haystack = `${msg.from} ${msg.subject} ${msg.bodyText} ${msg.snippet}`.toLowerCase();
  const senderEmail = parseSenderEmail(msg.from);

  const interventions = await fetchInterventionsForCompany(getAdminDb(), companyId, 250);
  const scored: Array<{
    interventionId: string;
    clientName: string;
    status: string | null;
    score: number;
    reasons: string[];
  }> = [];

  for (const row of interventions) {
    const id = String(row.id || "");
    if (!id) continue;
    const clientName =
      String(row.clientName || "").trim() ||
      [row.clientFirstName, row.clientLastName].filter(Boolean).join(" ").trim() ||
      String(row.clientCompanyName || "").trim() ||
      "Client";
    const ivHaystack = interventionSearchHaystack(row).toLowerCase();
    const reasons: string[] = [];
    let score = 0;

    const ivEmail = String(row.clientEmail || row.email || "").trim().toLowerCase();
    if (senderEmail && ivEmail && senderEmail === ivEmail) {
      score += 40;
      reasons.push("email expéditeur = email dossier");
    }

    const nameLower = clientName.toLowerCase();
    if (nameLower.length >= 3 && haystack.includes(nameLower)) {
      score += 25;
      reasons.push(`nom « ${clientName} » dans le mail`);
    }

    const tokens = nameLower.split(/\s+/).filter((t) => t.length >= 4);
    for (const token of tokens) {
      if (haystack.includes(token)) {
        score += 8;
        reasons.push(`mot « ${token} »`);
      }
    }

    if (ivHaystack && haystack.split(/\s+/).some((w) => w.length >= 5 && ivHaystack.includes(w))) {
      score += 5;
    }

    if (score > 0) {
      scored.push({
        interventionId: id,
        clientName,
        status: row.status != null ? String(row.status) : null,
        score,
        reasons: [...new Set(reasons)].slice(0, 4),
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, 5);

  return {
    messageId: msg.id,
    from: msg.from,
    subject: msg.subject,
    senderEmail: senderEmail || null,
    candidates,
    hint:
      candidates.length > 0
        ? "Proposez link_gmail_to_intervention avec interventionId du candidat le plus pertinent (après confirmation utilisateur)."
        : "Aucun dossier évident — utilisez search_workspace avec le nom du client puis link_gmail_to_intervention.",
  };
}

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

/** Lie un mail Gmail à une intervention (timeline Firestore). */
export async function linkGmailToIntervention(
  ctx: { companyId: string; actorUid: string },
  input: { messageId: string; interventionId: string; note?: string },
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
