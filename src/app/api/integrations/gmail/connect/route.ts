import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import {
  GMAIL_SEND_SCOPE,
  getGmailOAuthConfig,
  isGmailOAuthClientConfigured,
} from "@/core/services/email/gmailOAuthConfig";

/** Démarre le consentement OAuth Gmail (admin connecté). */
export async function GET(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if ("response" in auth) return auth.response;

  if (!isGmailOAuthClientConfigured()) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET requis dans .env.local (Google Cloud → Identifiants OAuth).",
      },
      { status: 500 },
    );
  }

  const { clientId, clientSecret, redirectUri } = getGmailOAuthConfig();
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GMAIL_SEND_SCOPE],
  });

  return NextResponse.redirect(url);
}
