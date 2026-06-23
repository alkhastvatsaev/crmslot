import { NextResponse } from "next/server";
import "@/core/config/firebase-admin";
import { logger } from "@/core/logger";
import { SendNotificationRequestSchema } from "@/core/api/schemas/notifications";
import { requireAuthenticatedUser, requireAnyCompanyStaff } from "@/core/api/routeAuth";
import { sendEmailNotification } from "@/app/api/notifications/send/sendNotificationEmail";
import { sendPushNotification } from "@/app/api/notifications/send/sendNotificationPush";

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
      return sendEmailNotification({ recipientRole, subjectKey, bodyKey, variables });
    }

    if (channel === "sms") {
      logger.info("[notifications] SMS channel not yet configured:", { subjectKey });
      return NextResponse.json({ success: true, skipped: true, channel: "sms" });
    }

    if (channel === "push") {
      return sendPushNotification({ recipientRole, subjectKey, bodyKey, variables });
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
