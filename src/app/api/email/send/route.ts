import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { getAdminDb } from "@/core/config/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "intervention_emails";

export async function POST(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if ("response" in auth) return auth.response;

  let body: {
    interventionId: string;
    companyId: string;
    to: string;
    subject: string;
    bodyText: string;
    bodyHtml?: string;
    inReplyTo?: string;
    references?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { interventionId, companyId, to, subject, bodyText, bodyHtml, inReplyTo, references } = body;

  if (!interventionId || !companyId || !to || !subject || !bodyText) {
    return NextResponse.json({ ok: false, error: "Champs manquants." }, { status: 400 });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const replyToDomain = process.env.REPLY_TO_DOMAIN ?? gmailUser?.split("@")[1] ?? "mapbelgique.com";

  if (!gmailUser || !gmailPass) {
    return NextResponse.json({ ok: false, error: "Configuration email manquante." }, { status: 500 });
  }

  const messageId = `<${crypto.randomUUID()}@${replyToDomain}>`;
  const replyTo = `support+${interventionId}@${replyToDomain}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  try {
    await transporter.sendMail({
      from: `"MAP BELGIQUE" <${gmailUser}>`,
      to,
      subject,
      text: bodyText,
      html: bodyHtml ?? `<p>${bodyText.replace(/\n/g, "<br>")}</p>`,
      replyTo,
      headers: {
        "Message-ID": messageId,
        ...(inReplyTo ? { "In-Reply-To": inReplyTo } : {}),
        ...(references ? { References: references } : {}),
        "X-Intervention-ID": interventionId,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Envoi échoué.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  try {
    const db = getAdminDb();
    await db.collection(COLLECTION).add({
      interventionId,
      companyId,
      direction: "outbound",
      from: gmailUser,
      to,
      subject,
      bodyText,
      ...(bodyHtml ? { bodyHtml } : {}),
      messageId,
      ...(inReplyTo ? { inReplyTo } : {}),
      ...(references ? { references } : {}),
      createdAt: FieldValue.serverTimestamp(),
      sentByUid: auth.uid,
      readAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[email/send] Firestore write failed:", err);
  }

  return NextResponse.json({ ok: true, messageId });
}
