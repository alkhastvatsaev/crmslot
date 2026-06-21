import { NextRequest, NextResponse } from "next/server";
import { gmail } from "@googleapis/gmail";
import { OAuth2Client } from "google-auth-library";
import {
  getGmailOAuthConfig,
  persistGmailOAuthFromCallback,
} from "@/core/services/email/gmailOAuthConfig";
import { getStoredGmailOAuth } from "@/core/services/email/gmailOAuthStore";
import { setGmailHubDisconnectedCookie } from "@/core/services/email/gmailHubSession";
import { verifyGmailOAuthState } from "@/core/services/email/gmailOAuthState";
import { flushPendingLecotEmails } from "@/features/chatbot/flushPendingLecotEmails";

export const runtime = "nodejs";

function appOrigin(): string {
  return process.env.PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

function redirectToHub(query: Record<string, string>, base?: NextResponse): NextResponse {
  const url = new URL("/", appOrigin());
  for (const [k, v] of Object.entries(query)) {
    if (v) url.searchParams.set(k, v);
  }
  const res = NextResponse.redirect(url, base ? { headers: base.headers } : undefined);
  if (query.gmail_connected === "1") {
    setGmailHubDisconnectedCookie(res, false);
  }
  return res;
}

/** Callback OAuth — enregistre le token (Firestore) et renvoie vers la page 6 (Gmail). */
export async function GET(req: NextRequest) {
  // Vérification anti-CSRF du state AVANT toute opération coûteuse / écriture.
  // Le cookie est consommé qu'il y ait succès ou échec (anti-replay).
  const stateCarrier = NextResponse.json({ ok: true });
  const stateCheck = verifyGmailOAuthState(
    req,
    stateCarrier,
    req.nextUrl.searchParams.get("state")
  );
  if (!stateCheck.ok) {
    return redirectToHub({ gmail_error: `state_${stateCheck.reason}` }, stateCarrier);
  }

  const err = req.nextUrl.searchParams.get("error");
  if (err) {
    return redirectToHub({ gmail_error: err }, stateCarrier);
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return redirectToHub({ gmail_error: "missing_code" }, stateCarrier);
  }

  const { clientId, clientSecret, redirectUri } = getGmailOAuthConfig();
  if (!clientId || !clientSecret) {
    return redirectToHub({ gmail_error: "missing_client" }, stateCarrier);
  }

  const oauth2 = new OAuth2Client(clientId, clientSecret, redirectUri);
  try {
    const { tokens } = await oauth2.getToken(code);
    const existing = await getStoredGmailOAuth();
    const refreshToken = tokens.refresh_token ?? existing?.refreshToken ?? "";
    if (!refreshToken) {
      return redirectToHub({ gmail_error: "no_refresh_token" }, stateCarrier);
    }

    oauth2.setCredentials({ refresh_token: refreshToken, access_token: tokens.access_token });
    const gmailClient = gmail({ version: "v1", auth: oauth2 });
    const profile = await gmailClient.users.getProfile({ userId: "me" });
    const email = profile.data.emailAddress?.trim() || existing?.email || "";
    if (!email) {
      return redirectToHub({ gmail_error: "no_email" }, stateCarrier);
    }

    await persistGmailOAuthFromCallback({ refreshToken, email });
    flushPendingLecotEmails().catch((err) => {
      console.error("[gmail-callback] flush pending lecot emails failed:", err);
    });
    return redirectToHub({ gmail_connected: "1" }, stateCarrier);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "oauth_exchange_failed";
    return redirectToHub({ gmail_error: msg.slice(0, 120) }, stateCarrier);
  }
}
