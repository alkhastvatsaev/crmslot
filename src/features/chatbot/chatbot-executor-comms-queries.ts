import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import { db, parseIsoMs } from "@/features/chatbot/chatbot-executor-db";

export async function listInboxNotifications(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>
) {
  const limit = Math.min(40, Math.max(1, Number(input.limit) || 20));
  const unreadOnly = input.unreadOnly === true;
  const snap = await db()
    .collection("companies")
    .doc(ctx.companyId)
    .collection("inboxNotifications")
    .where("recipientUid", "==", ctx.actorUid)
    .limit(60)
    .get();

  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);
  if (unreadOnly) rows = rows.filter((r) => r.read !== true);
  rows.sort((a, b) => parseIsoMs(b.createdAt) - parseIsoMs(a.createdAt));

  return rows.slice(0, limit).map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: typeof r.body === "string" ? r.body.slice(0, 280) : r.body,
    read: Boolean(r.read),
    interventionId: r.interventionId ?? null,
    createdAt: r.createdAt ?? null,
  }));
}

export async function listInterventionEmails(
  interventionId: string,
  input: Record<string, unknown>
) {
  const id = interventionId.trim();
  if (!id) throw new Error("interventionId requis");
  const limit = Math.min(30, Math.max(1, Number(input.limit) || 15));

  const snap = await db()
    .collection("intervention_emails")
    .where("interventionId", "==", id)
    .limit(50)
    .get();

  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>)
    .sort((a, b) => parseIsoMs(a.createdAt) - parseIsoMs(b.createdAt));

  return rows.slice(0, limit).map((r) => ({
    id: r.id,
    direction: r.direction ?? r.type ?? null,
    subject: r.subject ?? null,
    from: r.from ?? r.sender ?? null,
    snippet:
      typeof r.body === "string"
        ? r.body.slice(0, 200)
        : typeof r.snippet === "string"
          ? r.snippet.slice(0, 200)
          : null,
    createdAt: r.createdAt ?? null,
  }));
}

export async function listPortalChat(companyId: string, input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  const limit = Math.min(50, Math.max(1, Number(input.limit) || 25));
  const col = db().collection("portal_ivana_chat_messages");

  const snap = interventionId
    ? await col.where("interventionId", "==", interventionId).limit(80).get()
    : await col.where("companyId", "==", companyId).limit(80).get();

  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>)
    .sort((a, b) => parseIsoMs(a.createdAt) - parseIsoMs(b.createdAt));

  return rows.slice(-limit).map((r) => ({
    id: r.id,
    role: r.role,
    body: typeof r.body === "string" ? r.body.slice(0, 400) : "",
    interventionId: r.interventionId ?? null,
    createdAt: r.createdAt ?? null,
  }));
}
