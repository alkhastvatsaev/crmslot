import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { requireAuthenticatedUserOrLocalDev } from "@/core/api/routeAuth";
import { GMAIL_HUB_SCOPES } from "@/core/services/email/gmailHubScopes";
import {
  getGmailOAuthConfig,
  isGmailOAuthClientConfigured,
} from "@/core/services/email/gmailOAuthConfig";

export const runtime = "nodejs";

/** Démarre le consentement OAuth Gmail (admin connecté). */
export async function GET(req: NextRequest) {
  const auth = await requireAuthenticatedUserOrLocalDev(req);
  if ("response" in auth) return auth.response;

  if (!isGmailOAuthClientConfigured()) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET requis dans .env.local (Google Cloud → Identifiants OAuth).",
      },
      { status: 500 }
    );
  }

  const { clientId, clientSecret, redirectUri } = getGmailOAuthConfig();
  const oauth2 = new OAuth2Client(clientId, clientSecret, redirectUri);
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [...GMAIL_HUB_SCOPES],
  });

  return NextResponse.redirect(url);
}

/**
 * En `npm run dev`, accessible sans login (démo locale).
 * En production : `Authorization: Bearer` requis.
 */
