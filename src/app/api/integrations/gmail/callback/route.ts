import { NextRequest, NextResponse } from "next/server";
import { gmail } from "@googleapis/gmail";
import { OAuth2Client } from "google-auth-library";
import {
  getGmailOAuthConfig,
  persistGmailOAuthFromCallback,
} from "@/core/services/email/gmailOAuthConfig";
import { getStoredGmailOAuth } from "@/core/services/email/gmailOAuthStore";
import { setGmailHubDisconnectedCookie } from "@/core/services/email/gmailHubSession";
import { flushPendingLecotEmails } from "@/features/chatbot/flushPendingLecotEmails";

export const runtime = "nodejs";

function appOrigin(): string {
  return process.env.PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

function redirectToHub(query: Record<string, string>): NextResponse {
  const url = new URL("/", appOrigin());
  for (const [k, v] of Object.entries(query)) {
    if (v) url.searchParams.set(k, v);
  }
  const res = NextResponse.redirect(url);
  if (query.gmail_connected === "1") {
    setGmailHubDisconnectedCookie(res, false);
  }
  return res;
}

/** Callback OAuth — enregistre le token (Firestore) et renvoie vers la page 6 (Gmail). */
export async function GET(req: NextRequest) {
  const err = req.nextUrl.searchParams.get("error");
  if (err) {
    return redirectToHub({ gmail_error: err });
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return redirectToHub({ gmail_error: "missing_code" });
  }

  const { clientId, clientSecret, redirectUri } = getGmailOAuthConfig();
  if (!clientId || !clientSecret) {
    return redirectToHub({ gmail_error: "missing_client" });
  }

  const oauth2 = new OAuth2Client(clientId, clientSecret, redirectUri);
  try {
    const { tokens } = await oauth2.getToken(code);
    const existing = await getStoredGmailOAuth();
    const refreshToken = tokens.refresh_token ?? existing?.refreshToken ?? "";
    if (!refreshToken) {
      return redirectToHub({ gmail_error: "no_refresh_token" });
    }

    oauth2.setCredentials({ refresh_token: refreshToken, access_token: tokens.access_token });
    const gmailClient = gmail({ version: "v1", auth: oauth2 });
    const profile = await gmailClient.users.getProfile({ userId: "me" });
    const email = profile.data.emailAddress?.trim() || existing?.email || "";
    if (!email) {
      return redirectToHub({ gmail_error: "no_email" });
    }

    await persistGmailOAuthFromCallback({ refreshToken, email });
    flushPendingLecotEmails().catch((err) => {
      console.error("[gmail-callback] flush pending lecot emails failed:", err);
    });
    return redirectToHub({ gmail_connected: "1" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "oauth_exchange_failed";
    return redirectToHub({ gmail_error: msg.slice(0, 120) });
  }
}
