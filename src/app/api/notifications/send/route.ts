import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { logger } from "@/core/logger";
import { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";
import { SendNotificationRequestSchema } from "@/core/api/schemas/notifications";

export const runtime = "nodejs";

/**
 * POST /api/notifications/send
 *
 * Receives a notification payload and dispatches it via the appropriate channel.
 * For email: uses Gmail SMTP via nodemailer.
 * For SMS/push: placeholder for future Twilio / FCM integration.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = SendNotificationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const { channel, recipientRole, subjectKey, bodyKey, variables } = parsed.data;

    if (channel === "email") {
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

      // Resolve recipient email based on role
      // In production, this would look up the user's email from Firestore
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

    if (channel === "sms") {
      // Placeholder for Twilio integration
      logger.info("[notifications] SMS channel not yet configured:", { subjectKey });
      return NextResponse.json({ success: true, skipped: true, channel: "sms" });
    }

    if (channel === "push") {
      const uid = variables?.recipientUid?.trim();
      if (!uid) {
        logger.warn("[notifications] push send sans recipientUid", { subjectKey });
        return NextResponse.json({ success: true, skipped: true, reason: "no-uid" });
      }

      const title = interpolateTemplate(subjectKey, variables);
      const body = stripHtml(buildEmailHtml(bodyKey, variables)).slice(0, 220);
      const data: Record<string, string> = {};
      if (variables?.caseId) data.bmTechCase = variables.caseId;
      if (variables?.reminderId) data.bmTechReminder = variables.reminderId;

      const report = await sendNativePushToUser({ uid, title, body, data });
      return NextResponse.json({ success: true, channel: "push", ...report });
    }

    return NextResponse.json(
      { success: false, error: `Unknown channel: ${channel}` },
      { status: 400 }
    );
  } catch (error) {
    logger.error("[notifications] Send failed:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveRecipientEmail(role: string, variables: Record<string, string>): string | null {
  const explicit = variables.recipientEmail?.trim();
  if (explicit) return explicit;

  // In a full implementation, we'd query Firestore for the user's email.
  // For now, dispatcher emails go to the configured company inbox.
  if (role === "dispatcher") {
    return process.env.DISPATCH_NOTIFICATION_EMAIL || process.env.GMAIL_USER || null;
  }
  if (role === "client") {
    // Would be fetched from intervention.createdByUid → users/{uid}.email
    return variables.clientEmail || null;
  }
  if (role === "technician") {
    return variables.technicianEmail || null;
  }
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function interpolateTemplate(key: string, vars: Record<string, string>): string {
  // Map i18n keys to French text templates
  const templates: Record<string, string> = {
    "notifications.email.assigned.subject": "Votre intervention est confirmée — {{clientName}}",
    "notifications.email.en_route.subject": "Votre technicien est en route — {{technicianName}}",
    "notifications.email.done.subject": "Intervention terminée — {{title}}",
    "notifications.email.invoiced.subject": "Votre facture est disponible — {{title}}",
    "notifications.email.waiting_material.subject":
      "Intervention en attente de matériel — {{title}}",
    "notifications.email.cancelled.subject": "Intervention annulée — {{title}}",
    "notifications.email.report_rejected.subject":
      "Rapport refusé — veuillez compléter l'intervention {{title}}",
    weekly_digest: "Résumé hebdomadaire facturation — société {{companyId}}",
    appointment_reminder: "{{subject}}",
  };

  let text = templates[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
  }
  return text;
}

function buildEmailHtml(bodyKey: string, vars: Record<string, string>): string {
  const bodyTemplates: Record<string, string> = {
    "notifications.email.assigned.body": `
      <p>Bonjour <strong>{{clientName}}</strong>,</p>
      <p>Un technicien a été assigné à votre demande d'intervention.</p>
      <ul>
        <li><strong>Intervention :</strong> {{title}}</li>
        <li><strong>Adresse :</strong> {{address}}</li>
        <li><strong>Date prévue :</strong> {{scheduledDate}} à {{scheduledTime}}</li>
        <li><strong>Technicien :</strong> {{technicianName}}</li>
      </ul>
      <p>Vous recevrez une notification dès que le technicien sera en route.</p>`,
    "notifications.email.en_route.body": `
      <p>Bonjour <strong>{{clientName}}</strong>,</p>
      <p>Bonne nouvelle ! Votre technicien <strong>{{technicianName}}</strong> est en route vers :</p>
      <p><strong>{{address}}</strong></p>
      <p>Il devrait arriver sous peu. Merci de vous assurer que l'accès est possible.</p>`,
    "notifications.email.done.body": `
      <p>Bonjour <strong>{{clientName}}</strong>,</p>
      <p>Votre intervention <strong>{{title}}</strong> a été clôturée avec succès.</p>
      <p>Vous recevrez votre facture par email dans les plus brefs délais.</p>`,
    "notifications.email.invoiced.body": `
      <p>Bonjour <strong>{{clientName}}</strong>,</p>
      <p>Votre facture pour l'intervention <strong>{{title}}</strong> est maintenant disponible.</p>
      <p>Vous pouvez la consulter et la télécharger depuis votre espace client.</p>`,
    "notifications.email.waiting_material.body": `
      <p>Bonjour,</p>
      <p>L'intervention <strong>{{title}}</strong> à l'adresse <strong>{{address}}</strong> est en attente de matériel.</p>
      <p>Le technicien {{technicianName}} a fait une commande. Vous serez recontacté dès réception.</p>`,
    "notifications.email.cancelled.body": `
      <p>Bonjour <strong>{{clientName}}</strong>,</p>
      <p>Nous vous informons que votre intervention <strong>{{title}}</strong> a été annulée.</p>
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>`,
    "notifications.email.report_rejected.body": `
      <p>Bonjour,</p>
      <p>Le back-office a refusé votre rapport pour l'intervention <strong>{{title}}</strong>.</p>
      <p><strong>Motif :</strong> {{rejectionReason}}</p>
      <p>Merci de rouvrir la mission et de compléter ou corriger le rapport avant de le soumettre à nouveau.</p>`,
    weekly_digest_body: `
      <p>Résumé hebdomadaire facturation (société {{companyId}})</p>
      <ul>
        <li>Factures payées : {{paidCount}}</li>
        <li>Impayés : {{unpaidCount}}</li>
        <li>CA facturé HT : {{revenueEur}} €</li>
      </ul>`,
    appointment_reminder_body: `<pre>{{body}}</pre>`,
  };

  let body = bodyTemplates[bodyKey] || `<p>${bodyKey}</p>`;
  for (const [k, v] of Object.entries(vars)) {
    body = body.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
  }

  // Wrap in branded email template
  return `
    <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 24px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0f172a; font-size: 20px; margin: 0;">MAP BELGIQUE</h1>
        <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0;">Expertise & Sécurité Mobile</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
        ${body}
      </div>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">L'équipe MAP BELGIQUE</p>
        <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0;">Serrurerie · Alarme · Contrôle d'accès | Bruxelles</p>
      </div>
    </div>
  `;
}
