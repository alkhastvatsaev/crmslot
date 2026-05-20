import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserOrLocalDev } from "@/core/api/routeAuth";
import { createGmailApiClient } from "@/core/services/email/gmailApiClient";
import { encodeGmailRawMessage } from "@/core/services/email/gmailMessageBody";
import { isGmailOAuthConfigured, resolveGmailOAuthConfig } from "@/core/services/email/gmailOAuthConfig";
import { sendViaGmailApi } from "@/core/services/email/sendViaGmailApi";
import { mapGmailMessageSummary } from "@/features/gmail/gmailHubMappers";

export const runtime = "nodejs";

const msgCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60_000;

function msgCacheKey(labelId: string | undefined, q: string | undefined, maxResults: number, pageToken: string | undefined) {
  return `${labelId ?? ""}|${q ?? ""}|${maxResults}|${pageToken ?? ""}`;
}

function encodeSubjectUtf8(subject: string): string {
  const b64 = Buffer.from(subject, "utf8").toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}

/** Liste ou envoi de messages Gmail. */
export async function GET(req: NextRequest) {
  const auth = await requireAuthenticatedUserOrLocalDev(req);
  if ("response" in auth) return auth.response;

  if (!(await isGmailOAuthConfigured())) {
    return NextResponse.json({ error: "Gmail OAuth non configuré." }, { status: 503 });
  }

  const sp = req.nextUrl.searchParams;
  const labelId = sp.get("labelId")?.trim() || undefined;
  const q = sp.get("q")?.trim() || undefined;
  const maxResults = Math.min(Math.max(Number(sp.get("maxResults") || 15), 1), 25);
  const pageToken = sp.get("pageToken")?.trim() || undefined;

  const cacheKey = msgCacheKey(labelId, q, maxResults, pageToken);
  const cached = msgCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const gmail = await createGmailApiClient();
    const listRes = await gmail.users.messages.list({
      userId: "me",
      labelIds: labelId ? [labelId] : undefined,
      q,
      maxResults,
      pageToken,
    });

    const stubs = (listRes.data.messages ?? []).filter((s) => !!s.id);
    const messages: ReturnType<typeof mapGmailMessageSummary>[] = [];
    for (const stub of stubs) {
      const msgRes = await gmail.users.messages.get({
        userId: "me",
        id: stub.id!,
        format: "metadata",
        metadataHeaders: ["From", "To", "Subject", "Date"],
      });
      messages.push(mapGmailMessageSummary(msgRes.data));
    }

    const result = { messages, nextPageToken: listRes.data.nextPageToken ?? null };
    msgCache.set(cacheKey, { data: result, ts: Date.now() });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lecture de la boîte impossible.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUserOrLocalDev(req);
  if ("response" in auth) return auth.response;

  if (!(await isGmailOAuthConfigured())) {
    return NextResponse.json({ error: "Gmail OAuth non configuré." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const to = typeof (body as { to?: string }).to === "string" ? (body as { to: string }).to.trim() : "";
  const subject =
    typeof (body as { subject?: string }).subject === "string"
      ? (body as { subject: string }).subject.trim()
      : "";
  const bodyText =
    typeof (body as { bodyText?: string }).bodyText === "string"
      ? (body as { bodyText: string }).bodyText.trim()
      : "";
  const threadId =
    typeof (body as { threadId?: string }).threadId === "string"
      ? (body as { threadId: string }).threadId.trim()
      : undefined;
  const inReplyTo =
    typeof (body as { inReplyTo?: string }).inReplyTo === "string"
      ? (body as { inReplyTo: string }).inReplyTo.trim()
      : undefined;
  const references =
    typeof (body as { references?: string }).references === "string"
      ? (body as { references: string }).references.trim()
      : undefined;

  if (!to || !subject || !bodyText) {
    return NextResponse.json({ error: "Champs requis : to, subject, bodyText." }, { status: 400 });
  }

  const { senderEmail } = await resolveGmailOAuthConfig();
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "MAP BELGIQUE";
  const messageId = `<${crypto.randomUUID()}@${senderEmail?.split("@")[1] ?? "mapbelgique.com"}>`;
  const replyTo = senderEmail ?? to;

  try {
    if (threadId) {
      const gmail = await createGmailApiClient();
      const html = `<p>${bodyText.replace(/\n/g, "<br>")}</p>`;
      const lines = [
        `From: "${fromName}" <${senderEmail}>`,
        `To: ${to}`,
        `Subject: ${encodeSubjectUtf8(subject)}`,
        `Message-ID: ${messageId}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        ...(inReplyTo ? [`In-Reply-To: ${inReplyTo}`] : []),
        ...(references ? [`References: ${references}`] : []),
        "",
        Buffer.from(html, "utf8").toString("base64"),
      ];
      const raw = encodeGmailRawMessage(lines.join("\r\n"));
      const sent = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw, threadId },
      });
      return NextResponse.json({ ok: true, id: sent.data.id ?? null, threadId: sent.data.threadId ?? threadId });
    }

    await sendViaGmailApi({
      to,
      subject,
      bodyText,
      messageId,
      replyTo,
      inReplyTo,
      references,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Envoi impossible.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
