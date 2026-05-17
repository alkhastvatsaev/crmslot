import { NextResponse } from "next/server";
import { getAdminDb } from "@/core/config/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "intervention_emails";

/** Extrait +{interventionId} depuis support+abc123@domain.com */
function extractInterventionId(toAddress: string): string | null {
  const match = toAddress.match(/\+([^@+]+)@/);
  return match?.[1] ?? null;
}

/** SendGrid Inbound Parse envoie multipart/form-data */
async function parseSendGridPayload(req: Request) {
  const form = await req.formData();
  return {
    from: String(form.get("from") ?? ""),
    to: String(form.get("to") ?? ""),
    subject: String(form.get("subject") ?? ""),
    bodyText: String(form.get("text") ?? ""),
    bodyHtml: form.get("html") ? String(form.get("html")) : undefined,
    messageId: String(form.get("headers") ?? "").match(/Message-ID:\s*(<[^>]+>)/i)?.[1] ?? `<sg-${Date.now()}@inbound>`,
    inReplyTo: String(form.get("headers") ?? "").match(/In-Reply-To:\s*(<[^>]+>)/i)?.[1] ?? undefined,
    references: String(form.get("headers") ?? "").match(/References:\s*(.+?)(?:\r?\n\S|$)/i)?.[1]?.trim() ?? undefined,
  };
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const expectedSecret = process.env.EMAIL_INBOUND_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    from: string;
    to: string;
    subject: string;
    bodyText: string;
    bodyHtml?: string;
    messageId: string;
    inReplyTo?: string;
    references?: string;
  };

  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      payload = await parseSendGridPayload(req);
    } else {
      payload = await req.json();
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Parse error" }, { status: 400 });
  }

  const interventionId = extractInterventionId(payload.to);
  if (!interventionId) {
    return NextResponse.json({ ok: false, error: "No interventionId in To address" }, { status: 422 });
  }

  let companyId = "unknown";
  try {
    const db = getAdminDb();
    const snap = await db.collection("interventions").doc(interventionId).get();
    if (snap.exists) {
      companyId = String(snap.data()?.companyId ?? "unknown");
    }
  } catch {
    /* continue even if lookup fails */
  }

  try {
    const db = getAdminDb();
    await db.collection(COLLECTION).add({
      interventionId,
      companyId,
      direction: "inbound",
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      bodyText: payload.bodyText,
      ...(payload.bodyHtml ? { bodyHtml: payload.bodyHtml } : {}),
      messageId: payload.messageId,
      ...(payload.inReplyTo ? { inReplyTo: payload.inReplyTo } : {}),
      ...(payload.references ? { references: payload.references } : {}),
      createdAt: FieldValue.serverTimestamp(),
      readAt: null,
    });
  } catch (err) {
    console.error("[email/inbound] Firestore write failed:", err);
    return NextResponse.json({ ok: false, error: "Storage error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
