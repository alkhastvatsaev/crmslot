import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { getAdminDb, isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";
import type { WebhookEndpoint, WebhookEventType } from "@/features/integrations/types";

export const runtime = "nodejs";

const ALL_EVENTS: WebhookEventType[] = [
  "intervention.status_changed",
  "intervention.invoiced",
  "intervention.payment_received",
];

async function assertCompanyAdmin(
  request: Request,
  companyId: string
): Promise<{ uid: string } | NextResponse> {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;
  if (!isFirebaseAdminReady()) {
    return NextResponse.json(
      { ok: false, error: "Firebase Admin not configured" },
      { status: 503 }
    );
  }
  const allowed = await assertCanAssignInterventionServer(
    getAdminDb(),
    auth.decoded.uid,
    companyId,
    auth.decoded
  );
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  return { uid: auth.decoded.uid };
}

export async function GET(request: Request, context: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await context.params;
  const gate = await assertCompanyAdmin(request, companyId);
  if (gate instanceof NextResponse) return gate;

  const snap = await getAdminDb()
    .collection("companies")
    .doc(companyId)
    .collection("webhookEndpoints")
    .get();

  const endpoints = snap.docs.map((d) => {
    const data = d.data() as Omit<WebhookEndpoint, "id">;
    return { id: d.id, url: data.url, events: data.events, isActive: data.isActive };
  });

  return NextResponse.json({ ok: true, endpoints });
}

export async function POST(request: Request, context: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await context.params;
  const gate = await assertCompanyAdmin(request, companyId);
  if (gate instanceof NextResponse) return gate;

  let body: { url?: string; secret?: string; events?: WebhookEventType[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const url = body.url?.trim();
  const secret = body.secret?.trim();
  if (!url || !secret) {
    return NextResponse.json({ ok: false, error: "url and secret required" }, { status: 400 });
  }

  const ref = await getAdminDb()
    .collection("companies")
    .doc(companyId)
    .collection("webhookEndpoints")
    .add({
      companyId,
      url,
      secret,
      events: body.events?.length ? body.events : ALL_EVENTS,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

  return NextResponse.json({ ok: true, id: ref.id });
}
