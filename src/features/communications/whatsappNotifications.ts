export interface WhatsAppMessage {
  to: string;
  body: string;
}

export interface WhatsAppResult {
  ok: boolean;
  sid?: string;
  error?: string;
}

/**
 * Envoie un message WhatsApp via l'API Twilio.
 * Requiert TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.
 * Utilisable uniquement côté serveur (Node.js).
 */
export async function sendWhatsAppNotification(
  message: WhatsAppMessage,
): Promise<WhatsAppResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim();

  if (!accountSid || !authToken || !from) {
    return { ok: false, error: "Twilio credentials not configured" };
  }

  const normalizedTo = message.to.startsWith("whatsapp:")
    ? message.to
    : `whatsapp:${message.to}`;
  const normalizedFrom = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    To: normalizedTo,
    From: normalizedFrom,
    Body: message.body,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = (await res.json().catch(() => null)) as { sid?: string; message?: string } | null;

    if (!res.ok) {
      return { ok: false, error: data?.message ?? `HTTP ${res.status}` };
    }

    return { ok: true, sid: data?.sid };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Format message for intervention status updates.
 */
export function formatInterventionWhatsApp(params: {
  clientName: string;
  status: string;
  address: string;
}): string {
  const statusMessages: Record<string, string> = {
    assigned: `Bonjour ${params.clientName}, un technicien a été assigné à votre intervention (${params.address}). Il vous contactera prochainement.`,
    en_route: `Votre technicien est en route vers ${params.address}. Arrivée prévue dans quelques minutes.`,
    in_progress: `Votre intervention au ${params.address} est en cours.`,
    done: `Votre intervention au ${params.address} est terminée. Merci pour votre confiance !`,
  };
  return (
    statusMessages[params.status] ??
    `Mise à jour de votre intervention (${params.address}) : ${params.status}.`
  );
}
