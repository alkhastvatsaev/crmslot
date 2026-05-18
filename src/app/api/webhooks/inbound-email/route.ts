import { NextResponse } from "next/server";
import { getAdminDb } from "@/core/config/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "intervention_emails";

export async function POST(req: Request) {
  try {
    let toField = "";
    let fromField = "";
    let subject = "";
    let text = "";
    let html = "";
    let messageId = `<${crypto.randomUUID()}@inbound.mapbelgique.com>`;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      toField = formData.get("to")?.toString() || "";
      fromField = formData.get("from")?.toString() || "";
      subject = formData.get("subject")?.toString() || "";
      text = formData.get("text")?.toString() || "";
      html = formData.get("html")?.toString() || "";
      const headers = formData.get("headers")?.toString() || "";
      
      const msgIdMatch = headers.match(/Message-ID:\s*([^\r\n]+)/i);
      if (msgIdMatch && msgIdMatch[1]) {
        messageId = msgIdMatch[1].trim();
      }
      
      const envelopeStr = formData.get("envelope")?.toString();
      if (envelopeStr) {
        try {
          const envelope = JSON.parse(envelopeStr);
          if (envelope.to && Array.isArray(envelope.to) && envelope.to.length > 0) {
            toField = envelope.to[0];
          }
        } catch {
          // ignore parsing error
        }
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      toField = body.to || "";
      fromField = body.from || "";
      subject = body.subject || "";
      text = body.text || body.textBody || "";
      html = body.html || body.htmlBody || "";
      if (body.messageId || body.MessageID) {
        messageId = body.messageId || body.MessageID;
      }
    }

    if (!toField) {
      return NextResponse.json({ ok: false, error: "Missing 'to' field" }, { status: 400 });
    }

    // Extract intervention ID from support+INTERVENTION_ID@domain.com
    const match = toField.match(/support\+([^@]+)@/i);
    if (!match || !match[1]) {
      // Not an intervention reply, maybe standard support
      return NextResponse.json({ ok: true, message: "Ignored, no intervention ID found" });
    }

    const interventionId = match[1];

    const db = getAdminDb();
    
    // Attempt to find companyId from intervention
    let companyId = "unknown";
    try {
      const ivSnap = await db.collection("interventions").doc(interventionId).get();
      if (ivSnap.exists) {
        companyId = ivSnap.data()?.companyId || "unknown";
      }
    } catch {
      // Proceed with unknown
    }

    await db.collection(COLLECTION).add({
      interventionId,
      companyId,
      direction: "inbound",
      from: fromField,
      to: toField,
      subject: subject || "Sans objet",
      bodyText: text || "Message vide",
      ...(html ? { bodyHtml: html } : {}),
      messageId,
      createdAt: FieldValue.serverTimestamp(),
      readAt: null, // marks as unread
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[inbound-email] Error processing webhook:", err);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
