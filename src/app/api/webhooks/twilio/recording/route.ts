import { NextResponse } from "next/server";
import { readTwilioWebhookParams, validateTwilioWebhookRequest } from "@/core/api/twilioWebhook";
import { downloadTwilioRecording } from "@/core/services/audio/downloadTwilioRecording";
import { ingestCallAudioBuffer } from "@/core/services/audio/ingestCallAudioBuffer";
import { logger } from "@/core/logger";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Callback Twilio après enregistrement vocal (TwiML `record` dans `/api/webhooks/twilio/incoming`).
 * Télécharge l’audio, l’enregistre dans `public/uploads` et lance la transcription (pipeline Galaxy).
 */
export async function POST(req: Request) {
  try {
    const params = await readTwilioWebhookParams(req);
    if (!validateTwilioWebhookRequest(req, params)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const recordingUrl = params.RecordingUrl?.trim();
    if (!recordingUrl) {
      return NextResponse.json({ ok: false, error: "RecordingUrl manquant" }, { status: 400 });
    }

    const phone = params.From?.trim() || params.Caller?.trim() || params.CallSid?.trim() || null;
    const buffer = await downloadTwilioRecording(recordingUrl);
    const { publicUrl } = await ingestCallAudioBuffer({
      buffer,
      ext: ".wav",
      phone,
      source: "twilio-recording",
      fileBase: phone
        ? `twilio-${phone.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now()}`
        : `twilio-${Date.now()}`,
    });

    return NextResponse.json({ ok: true, audioUrl: publicUrl }, { status: 200 });
  } catch (error) {
    logger.error("[twilio-recording] error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
