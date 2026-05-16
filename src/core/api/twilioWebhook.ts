import twilio from "twilio";
import { isProductionNodeEnv } from "@/core/api/routeAuth";

/**
 * Valide la signature Twilio (`X-Twilio-Signature`) pour les webhooks POST.
 * En dev sans `TWILIO_AUTH_TOKEN`, retourne true pour faciliter les tests locaux.
 */
export function validateTwilioWebhookRequest(
  request: Request,
  params: Record<string, string>,
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!authToken) {
    return !isProductionNodeEnv();
  }

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return false;

  const baseUrl = process.env.TWILIO_WEBHOOK_PUBLIC_URL?.trim();
  if (!baseUrl) {
    return !isProductionNodeEnv();
  }

  const pathname = new URL(request.url).pathname;
  const webhookUrl = `${baseUrl.replace(/\/$/, "")}${pathname}`;

  return twilio.validateRequest(authToken, signature, webhookUrl, params);
}

/** Parse le corps `application/x-www-form-urlencoded` ou `multipart/form-data` Twilio. */
export async function readTwilioWebhookParams(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  const out: Record<string, string> = {};

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    for (const part of text.split("&")) {
      if (!part) continue;
      const [rawKey, rawVal = ""] = part.split("=");
      const key = decodeURIComponent(rawKey.replace(/\+/g, " "));
      out[key] = decodeURIComponent(rawVal.replace(/\+/g, " "));
    }
    return out;
  }

  const form = await request.formData();
  form.forEach((value, key) => {
    out[key] = typeof value === "string" ? value : value.name;
  });
  return out;
}
