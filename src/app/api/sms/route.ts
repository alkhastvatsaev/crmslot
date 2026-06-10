import { NextResponse } from "next/server";
import twilio from "twilio";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { logger } from "@/core/logger";

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  try {
    // Récupération des données envoyées depuis le frontend
    const { to, message } = await request.json();

    if (!to || !message) {
      return NextResponse.json({ error: "Paramètres manquants (to, message)" }, { status: 400 });
    }

    // Récupération des clés secrètes depuis .env.local
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      logger.error("Clés Twilio manquantes dans .env.local");
      return NextResponse.json({ error: "Erreur de configuration serveur" }, { status: 500 });
    }

    // Initialisation du client Twilio
    const client = twilio(accountSid, authToken);

    // Envoi du SMS réel via l'API Twilio
    const twilioResponse = await client.messages.create({
      body: message,
      from: fromPhone,
      to: to,
    });

    return NextResponse.json({ success: true, messageId: twilioResponse.sid }, { status: 200 });
  } catch (error) {
    logger.error("❌ Erreur Twilio:", {
      error: error instanceof Error ? error.message : String(error),
    });
    const message = error instanceof Error ? error.message : "Échec de l'envoi du SMS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
