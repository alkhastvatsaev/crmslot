import { createHmac } from "crypto";
import type { OutboundWebhookPayload, WebhookEndpoint, WebhookEventType } from "./types";

export function signWebhookPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export async function deliverWebhook(
  endpoint: WebhookEndpoint,
  payload: OutboundWebhookPayload
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const body = JSON.stringify(payload);
  const signature = signWebhookPayload(endpoint.secret, body);
  try {
    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Belgmap-Signature": signature,
        "X-Belgmap-Event": payload.event,
      },
      body,
    });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "fetch failed" };
  }
}

export function endpointSubscribed(endpoint: WebhookEndpoint, event: WebhookEventType): boolean {
  return endpoint.isActive && endpoint.events.includes(event);
}
