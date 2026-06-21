import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import nodemailer from "nodemailer";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { logger } from "@/core/logger";
import { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";
import { listCompanyStaff } from "@/features/company/server/listCompanyStaff";
import { SendNotificationRequestSchema } from "@/core/api/schemas/notifications";
import { requireAuthenticatedUser, requireAnyCompanyStaff } from "@/core/api/routeAuth";

export const runtime = "nodejs";

/**
 * POST /api/notifications/send
 *
 * Receives a notification payload and dispatches it via the appropriate channel.
 * For email: uses Gmail SMTP via nodemailer.
 * For SMS/push: placeholder for future Twilio / FCM integration.
 */
export async function POST(req: Request) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;
  const staffDenied = await requireAnyCompanyStaff(authResult.uid, authResult.decoded);
  if (staffDenied) return staffDenied;

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
      const title = interpolateTemplate(subjectKey, variables);
      const body = stripHtml(buildEmailHtml(bodyKey, variables)).slice(0, 220);
      const data: Record<string, string> = {};
      if (variables?.caseId) data.bmTechCase = variables.caseId;
      if (variables?.reminderId) data.bmTechReminder = variables.reminderId;
      if (variables?.interventionId) data.bmInterventionId = variables.interventionId;

      // Dispatcher → broadcast aux admins de la société.
      if (recipientRole === "dispatcher") {
        const companyId = variables?.companyId?.trim();
        if (!companyId) {
          logger.warn("[notifications] push dispatcher sans companyId", { subjectKey });
          return NextResponse.json({ success: true, skipped: true, reason: "no-company" });
        }
        const adminUids = await listAdminUidsForCompany(companyId);
        if (adminUids.length === 0) {
          return NextResponse.json({ success: true, skipped: true, reason: "no-admins" });
        }
        let sent = 0;
        let failed = 0;
        let removedStale = 0;
        for (const uid of adminUids) {
          try {
            const report = await sendNativePushToUser({ uid, title, body, data });
            sent += report.sent;
            failed += report.failed;
            removedStale += report.removedStale;
          } catch (err) {
            failed += 1;
            logger.warn("[notifications] push admin broadcast failed", {
              uid,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
        return NextResponse.json({
          success: true,
          channel: "push",
          recipientRole: "dispatcher",
          broadcastTo: adminUids.length,
          sent,
          failed,
          removedStale,
        });
      }

      const uid = variables?.recipientUid?.trim();
      if (!uid) {
        logger.warn("[notifications] push send sans recipientUid", { subjectKey });
        return NextResponse.json({ success: true, skipped: true, reason: "no-uid" });
      }

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

/** Liste les UIDs des admins actifs d'une société (broadcast push dispatcher). */
async function listAdminUidsForCompany(companyId: string): Promise<string[]> {
  try {
    const db = getAdminDb();
    const staff = await listCompanyStaff(db, admin.auth, companyId);
    return staff
      .filter((member) => member.role === "admin" && member.active !== false)
      .map((member) => member.uid)
      .filter((uid): uid is string => typeof uid === "string" && uid.length > 0);
  } catch (err) {
    logger.warn("[notifications] listAdminUidsForCompany failed", {
      companyId,
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

function resolveRecipientEmail(role: string, variables: Record<string, string>): string | null {
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
    // Emails existants
    "notifications.email.assigned.subject": "Votre intervention est confirmée — {{clientName}}",
    "notifications.email.en_route.subject": "Votre technicien est en route — {{technicianName}}",
    "notifications.email.done.subject": "Intervention terminée — {{title}}",
    "notifications.email.invoiced.subject": "Votre facture est disponible — {{title}}",
    "notifications.email.waiting_material.subject":
      "Intervention en attente de matériel — {{title}}",
    "notifications.email.cancelled.subject": "Intervention annulée — {{title}}",
    "notifications.email.report_rejected.subject":
      "Rapport refusé — veuillez compléter l'intervention {{title}}",
    // Emails nouveaux
    "notifications.email.pending.subject": "Nouveau dossier reçu — {{title}}",
    "notifications.email.needs_address.subject": "Adresse manquante — {{title}}",
    "notifications.email.done_dispatcher.subject":
      "Rapport à valider — {{title}} ({{technicianName}})",
    // Push (titres courts)
    "notifications.push.assigned.subject": "Nouvelle mission",
    "notifications.push.in_progress.subject": "Intervention démarrée",
    "notifications.push.waiting_material.subject": "Matériel à commander",
    "notifications.push.material_received.subject": "Matériel reçu — on reprend",
    "notifications.push.cancelled_staff.subject": "Dossier annulé",
    "notifications.push.needs_address_dispatcher.subject": "Adresse manquante",
    // Divers
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
    // ── Push (texte court, mis directement dans `body` FCM) ──
    "notifications.push.assigned.body": `{{title}} — {{address}}`,
    "notifications.push.in_progress.body": `Votre technicien {{technicianName}} a commencé.`,
    "notifications.push.waiting_material.body": `{{title}} — pièce à commander`,
    "notifications.push.material_received.body": `Matériel reçu pour {{title}} — on reprend`,
    "notifications.push.cancelled_staff.body": `Dossier {{title}} annulé`,
    "notifications.push.needs_address_dispatcher.body": `{{title}} — adresse à compléter`,
    // ── Emails nouveaux ──
    "notifications.email.pending.body": `
      <p>Nouveau dossier reçu :</p>
      <ul>
        <li><strong>Titre :</strong> {{title}}</li>
        <li><strong>Adresse :</strong> {{address}}</li>
        <li><strong>Client :</strong> {{clientName}} ({{clientPhone}})</li>
      </ul>
      <p>À traiter depuis le back-office.</p>`,
    "notifications.email.needs_address.body": `
      <p>L'adresse du dossier <strong>{{title}}</strong> est manquante.</p>
      <p>Le dossier ne peut pas être assigné tant que l'adresse n'est pas renseignée.</p>`,
    "notifications.email.done_dispatcher.body": `
      <p>Le technicien <strong>{{technicianName}}</strong> a terminé l'intervention <strong>{{title}}</strong>.</p>
      <p>Le rapport est à valider dans le back-office.</p>`,
    // ── Emails existants ──
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
