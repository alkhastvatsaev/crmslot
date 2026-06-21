import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { requireAuthenticatedUserOrLocalDev } from "@/core/api/routeAuth";
import { GMAIL_HUB_SCOPES } from "@/core/services/email/gmailHubScopes";
import {
  getGmailOAuthConfig,
  isGmailOAuthClientConfigured,
} from "@/core/services/email/gmailOAuthConfig";
import { setGmailHubDisconnectedCookie } from "@/core/services/email/gmailHubSession";
import { issueGmailOAuthState } from "@/core/services/email/gmailOAuthState";

export const runtime = "nodejs";

/** URL OAuth Gmail (JSON) — à ouvrir côté client après `fetchWithAuth` (pas dans la barre d’adresse). */
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
  const res = NextResponse.json({ url: "" });
  let state: string;
  try {
    state = issueGmailOAuthState(res, auth.uid);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "GMAIL_OAUTH_STATE_SECRET non configuré (anti-CSRF).",
      },
      { status: 500 }
    );
  }
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [...GMAIL_HUB_SCOPES],
    state,
  });

  setGmailHubDisconnectedCookie(res, false);
  return NextResponse.json({ url }, { headers: res.headers });
}
