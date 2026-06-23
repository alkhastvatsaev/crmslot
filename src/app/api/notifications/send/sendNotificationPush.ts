import { NextResponse } from "next/server";
import { logger } from "@/core/logger";
import { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";
import {
  buildEmailHtml,
  interpolateTemplate,
  stripHtml,
} from "@/app/api/notifications/send/sendNotificationTemplates";
import { listAdminUidsForCompany } from "@/app/api/notifications/send/sendNotificationRecipients";

export async function sendPushNotification(input: {
  recipientRole?: string;
  subjectKey: string;
  bodyKey: string;
  variables: Record<string, string>;
}) {
  const { recipientRole, subjectKey, bodyKey, variables } = input;
  const title = interpolateTemplate(subjectKey, variables);
  const body = stripHtml(buildEmailHtml(bodyKey, variables)).slice(0, 220);
  const data: Record<string, string> = {};
  if (variables?.caseId) data.bmTechCase = variables.caseId;
  if (variables?.reminderId) data.bmTechReminder = variables.reminderId;
  if (variables?.interventionId) data.bmInterventionId = variables.interventionId;

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
