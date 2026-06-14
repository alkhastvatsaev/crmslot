import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import {
  deliverWebhook,
  endpointSubscribed,
} from "@/features/integrations/dispatchOutboundWebhook";
import type { OutboundWebhookPayload, WebhookEndpoint, WebhookEventType } from "../types";

export async function dispatchCompanyWebhooksAdmin(
  companyId: string,
  event: WebhookEventType,
  payload: Omit<OutboundWebhookPayload, "event" | "companyId">
): Promise<number> {
  const db = getAdminDb();
  const snap = await db
    .collection("companies")
    .doc(companyId)
    .collection("webhookEndpoints")
    .where("isActive", "==", true)
    .get();

  const endpoints = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<WebhookEndpoint, "id">),
  }));

  const fullPayload: OutboundWebhookPayload = {
    event,
    companyId,
    ...payload,
  };

  let delivered = 0;
  for (const endpoint of endpoints) {
    if (!endpointSubscribed(endpoint, event)) continue;
    const result = await deliverWebhook(endpoint, fullPayload);
    if (result.ok) delivered += 1;
    await db
      .collection("companies")
      .doc(companyId)
      .collection("webhookDeliveries")
      .add({
        endpointId: endpoint.id,
        event,
        ok: result.ok,
        status: result.status ?? null,
        error: result.error ?? null,
        at: new Date().toISOString(),
      });
  }
  return delivered;
}
