/**
 * Télécharge un enregistrement vocal Twilio (URL fournie par le webhook `RecordingStatusCallback`).
 */
export async function downloadTwilioRecording(recordingUrl: string): Promise<Buffer> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN manquants pour télécharger l’audio.");
  }

  let url = recordingUrl.trim();
  if (!/\.(wav|mp3|m4a)(\?|$)/i.test(url)) {
    url = `${url}.wav`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Téléchargement Twilio échoué (${res.status})`);
  }

  return Buffer.from(await res.arrayBuffer());
}
