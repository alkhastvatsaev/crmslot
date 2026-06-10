import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { featureFlagsFromEnv } from "@/core/featureFlags";
import {
  sendWhatsAppNotification,
  formatInterventionWhatsApp,
} from "@/features/communications/whatsappNotifications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!featureFlagsFromEnv().whatsappNotifications) {
    return NextResponse.json(
      { ok: false, error: "WhatsApp notifications disabled (NEXT_PUBLIC_FF_WHATSAPP)" },
      { status: 403 }
    );
  }

  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  let body: {
    to?: string;
    message?: string;
    interventionStatus?: string;
    address?: string;
    clientName?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const to = body.to?.trim();
  if (!to) {
    return NextResponse.json({ ok: false, error: "Missing 'to' phone number" }, { status: 400 });
  }

  const message =
    body.message?.trim() ??
    (body.interventionStatus && body.address && body.clientName
      ? formatInterventionWhatsApp({
          clientName: body.clientName,
          status: body.interventionStatus,
          address: body.address,
        })
      : null);

  if (!message) {
    return NextResponse.json(
      { ok: false, error: "Missing message or intervention details" },
      { status: 400 }
    );
  }

  const result = await sendWhatsAppNotification({ to, body: message });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
