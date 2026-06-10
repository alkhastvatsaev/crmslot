import { NextResponse } from "next/server";
import twilio from "twilio";
import { readTwilioWebhookParams, validateTwilioWebhookRequest } from "@/core/api/twilioWebhook";
import { logger } from "@/core/logger";

export async function POST(req: Request) {
  try {
    const params = await readTwilioWebhookParams(req);
    if (!validateTwilioWebhookRequest(req, params)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    twiml.say(
      { voice: "alice", language: "fr-FR" },
      "Bienvenue chez Serrurier Express Belgique. Nous allons vous aider. Veuillez indiquer votre nom, votre adresse complète et décrire votre problème après le bip. Un technicien interviendra immédiatement."
    );

    twiml.record({
      recordingStatusCallback: "/api/webhooks/twilio/recording",
      recordingStatusCallbackMethod: "POST",
      recordingStatusCallbackEvent: ["completed"],
      playBeep: true,
      maxLength: 120,
    });

    twiml.say(
      { voice: "alice", language: "fr-FR" },
      "Nous n'avons pas reçu d'enregistrement. Au revoir."
    );

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    logger.error("Error generating TwiML:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
