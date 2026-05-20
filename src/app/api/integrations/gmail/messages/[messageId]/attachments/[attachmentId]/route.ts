import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserOrLocalDev } from "@/core/api/routeAuth";
import { createGmailApiClient } from "@/core/services/email/gmailApiClient";
import { decodeGmailBase64UrlToBuffer } from "@/core/services/email/gmailMessageBody";
import { isGmailOAuthConfigured } from "@/core/services/email/gmailOAuthConfig";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ messageId: string; attachmentId: string }>;
};

/** Télécharge une pièce jointe Gmail (corps binaire en base64 standard). */
export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await requireAuthenticatedUserOrLocalDev(req);
  if ("response" in auth) return auth.response;

  if (!(await isGmailOAuthConfigured())) {
    return NextResponse.json({ error: "Gmail OAuth non configuré." }, { status: 503 });
  }

  const { messageId, attachmentId } = await context.params;
  const msgId = messageId?.trim();
  const attId = attachmentId?.trim();
  if (!msgId || !attId) {
    return NextResponse.json({ error: "messageId et attachmentId requis." }, { status: 400 });
  }

  const filename = req.nextUrl.searchParams.get("filename")?.trim() || "attachment";
  const mimeType = req.nextUrl.searchParams.get("mimeType")?.trim() || "application/octet-stream";

  try {
    const gmail = await createGmailApiClient();
    const res = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: msgId,
      id: attId,
    });
    const raw = res.data.data;
    if (!raw) {
      return NextResponse.json({ error: "Pièce jointe vide." }, { status: 404 });
    }
    const buffer = decodeGmailBase64UrlToBuffer(raw);
    return NextResponse.json({
      filename,
      mimeType,
      size: buffer.length,
      dataBase64: buffer.toString("base64"),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Pièce jointe introuvable.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
