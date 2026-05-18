import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { sendInterventionEmail } from "@/core/services/email/sendInterventionEmail";

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

  const result = await sendInterventionEmail({
    interventionId,
    companyId,
    to,
    subject,
    bodyText,
    bodyHtml,
    inReplyTo,
    references,
    sentByUid: auth.uid,
    sentVia: "api",
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
