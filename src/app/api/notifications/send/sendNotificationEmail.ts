import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { logger } from "@/core/logger";
import {
  buildEmailHtml,
  interpolateTemplate,
} from "@/app/api/notifications/send/sendNotificationTemplates";
import { resolveRecipientEmail } from "@/app/api/notifications/send/sendNotificationRecipients";

export async function sendEmailNotification(input: {
  recipientRole?: string;
  subjectKey: string;
  bodyKey: string;
  variables: Record<string, string>;
}) {
  const { recipientRole, subjectKey, bodyKey, variables } = input;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    logger.warn("[notifications] Gmail credentials not configured, skipping email.");
    return NextResponse.json({ success: true, skipped: true });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  const recipientEmail = resolveRecipientEmail(recipientRole ?? "", variables);
  if (!recipientEmail) {
    logger.warn(`[notifications] No email for role=${recipientRole}, skipping.`);
    return NextResponse.json({ success: true, skipped: true });
  }

  const subject = interpolateTemplate(subjectKey, variables);
  const htmlBody = buildEmailHtml(bodyKey, variables);

  await transporter.sendMail({
    from: `"MAP BELGIQUE" <${gmailUser}>`,
    to: recipientEmail,
    subject,
    html: htmlBody,
  });

  return NextResponse.json({ success: true, channel: "email" });
}
